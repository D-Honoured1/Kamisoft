export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth/server-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { LeadershipActions } from "@/components/admin/leadership-actions"
import { Users, Plus, Eye, Star, Mail, Linkedin, Twitter } from "lucide-react"
import Link from "next/link"

export default async function LeadershipPage() {
  // Require authentication
  const adminUser = await requireAuth()

  const supabase = createServerClient()

  const { data: leadership, error } = await supabase
    .from("leadership_team")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching leadership team:", error)
  }

  const activeMembers = leadership?.filter(m => m.is_active) || []
  const inactiveMembers = leadership?.filter(m => !m.is_active) || []

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leadership Management</h1>
          <p className="text-muted-foreground mt-2">Manage your leadership team members</p>
        </div>
        <Button asChild>
          <Link href="/admin/leadership/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{leadership?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeMembers.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Executive Team</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {leadership?.filter(m => m.position.toLowerCase().includes('chief') || m.position.toLowerCase().includes('ceo') || m.position.toLowerCase().includes('coo') || m.position.toLowerCase().includes('cto')).length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leadership Team Grid */}
      {leadership && leadership.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leadership.map((member: any) => (
            <Card key={member.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted/50">
                      {member.profile_image_url ? (
                        <img
                          src={member.profile_image_url}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <span className="text-2xl text-muted-foreground">{member.name?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription className="text-sm">{member.position}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={member.is_active ? "default" : "secondary"}>
                    {member.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {member.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{member.bio}</p>
                  )}

                  {/* Contact Information */}
                  <div className="space-y-2">
                    {member.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {member.linkedin_url && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={member.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {member.twitter_url && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={member.twitter_url} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Display Order: {member.display_order}</span>
                    <span>Created: {new Date(member.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link href={`/admin/leadership/edit/${member.id}`}>
                        Edit
                      </Link>
                    </Button>
                    <LeadershipActions memberId={member.id} memberName={member.name} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No leadership members yet</h3>
            <p className="text-muted-foreground mb-4">Start building your leadership team by adding your first member.</p>
            <Button asChild>
              <Link href="/admin/leadership/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Member
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}