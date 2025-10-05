"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getAllTeamMembers, deleteTeamMember } from "@/lib/queries/content"
import type { TeamMember } from "@/lib/types/database"
import { Plus, Edit, Trash2, Search, Mail, Linkedin, Github } from "lucide-react"
import Image from "next/image"

export default function AdminTeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [filteredTeam, setFilteredTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadTeam()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = team.filter(
        (member) =>
          member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredTeam(filtered)
    } else {
      setFilteredTeam(team)
    }
  }, [searchTerm, team])

  async function loadTeam() {
    try {
      const data = await getAllTeamMembers()
      setTeam(data)
      setFilteredTeam(data)
    } catch (error) {
      console.error("Failed to load team:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name} from the team?`)) return

    try {
      await deleteTeamMember(id)
      setTeam(team.filter((member) => member.id !== id))
    } catch (error) {
      console.error("Failed to delete team member:", error)
      alert("Failed to delete team member")
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading team...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">{team.length} total members</p>
        </div>
        <Button asChild>
          <Link href="/admin/team/new">
            <Plus className="mr-2 h-4 w-4" />
            New Team Member
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTeam.map((member) => (
          <Card key={member.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex gap-4 flex-1">
                {member.profile_image_url && (
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                    <Image
                      src={member.profile_image_url}
                      alt={member.full_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{member.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-2">{member.position}</p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {member.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {member.is_leadership && <Badge variant="outline">Leadership</Badge>}
                    {member.department && (
                      <Badge variant="outline" className="capitalize">
                        {member.department}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 text-muted-foreground">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="hover:text-foreground">
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {member.github_url && (
                      <a
                        href={member.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/team/edit/${member.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(member.id, member.full_name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {member.bio && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{member.bio}</p>
              )}
              <div className="flex gap-4 text-xs text-muted-foreground">
                {member.years_of_experience && (
                  <span>{member.years_of_experience} years experience</span>
                )}
                <span>Order: {member.display_order}</span>
                <span>Joined: {new Date(member.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTeam.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm
                ? "No team members found matching your search."
                : "No team members found. Add your first one to get started."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
