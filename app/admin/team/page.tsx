export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth/server-auth"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHomeButton } from "@/components/admin-navigation/dashboard-home-button"
import { Plus, Edit, Mail, Linkedin, Github } from "lucide-react"
import Image from "next/image"
import { TeamActions } from "@/components/admin/team-actions"

export default async function AdminTeamPage() {
  // Require authentication
  await requireAuth()

  const supabase = createServerClient()

  const { data: team, error } = await supabase
    .from("team_members")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHomeButton />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">{team?.length || 0} total members</p>
        </div>
        <Button asChild>
          <Link href="/admin/team/new">
            <Plus className="mr-2 h-4 w-4" />
            New Team Member
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {team && team.length > 0 ? team.map((member: any) => (
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
                <TeamActions memberId={member.id} memberName={member.full_name} />
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
        )) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No team members found. Add your first one to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
