"use client"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { getAllProducts, deleteProduct } from "@/lib/queries/content-client"
import type { Product } from "@/lib/types/database"

export default function AdminProductsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAdminAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchTerm, products])

  async function loadProducts() {
    try {
      const data = await getAllProducts()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error("Failed to load products:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      await deleteProduct(id)
      loadProducts()
    } catch (error) {
      console.error("Failed to delete product:", error)
      alert("Failed to delete product. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading products...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your company products</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Launch Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    {product.pricing_model === "free" ? (
                      <Badge variant="secondary">Free</Badge>
                    ) : product.pricing_model === "subscription" ? (
                      <Badge variant="default">Subscription</Badge>
                    ) : product.pricing_model === "custom" ? (
                      <Badge variant="outline">Custom</Badge>
                    ) : (
                      <Badge variant="outline">{product.pricing_model}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.is_active ? (
                      <Badge variant="default" className="gap-1">
                        <Eye className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <EyeOff className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.launch_date
                      ? new Date(product.launch_date).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/products/edit/${product.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
