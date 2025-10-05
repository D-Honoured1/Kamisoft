import { getAllTeamMembers } from "@/lib/queries/content"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Mail, Linkedin, Github, Twitter } from "lucide-react"

export const metadata = {
  title: "Our Team | Kamisoft Enterprises - Meet the Experts",
  description:
    "Meet the talented team behind Kamisoft Enterprises. Expert developers, engineers, and consultants with 9+ years of experience.",
}

export default async function TeamPage() {
  const allTeam = await getAllTeamMembers({ active_only: true })
  const leadership = allTeam.filter((member) => member.is_leadership)
  const team = allTeam.filter((member) => !member.is_leadership)

  return (
    <div className="flex flex-col">
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              Our Team
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              Meet the <span className="text-primary">Experts</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              A diverse team of talented professionals dedicated to delivering exceptional software
              solutions and driving innovation.
            </p>
          </div>
        </div>
      </section>

      {leadership.length > 0 && (
        <section className="py-20">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center">Leadership Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {leadership.map((member) => (
                <div
                  key={member.id}
                  className="bg-card rounded-lg p-6 border hover:shadow-lg transition-shadow"
                >
                  {member.profile_image_url && (
                    <div className="relative h-48 w-48 mx-auto mb-4 rounded-full overflow-hidden">
                      <Image
                        src={member.profile_image_url}
                        alt={member.full_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-1">{member.full_name}</h3>
                    <p className="text-muted-foreground mb-2">{member.position}</p>

                    {member.department && (
                      <Badge variant="outline" className="mb-4 capitalize">
                        {member.department}
                      </Badge>
                    )}

                    {member.bio && <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>}

                    {member.specializations && member.specializations.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {member.specializations.slice(0, 3).map((spec, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 justify-center text-muted-foreground">
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="hover:text-primary transition-colors"
                        >
                          <Mail className="h-5 w-5" />
                        </a>
                      )}
                      {member.linkedin_url && (
                        <a
                          href={member.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                      {member.github_url && (
                        <a
                          href={member.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          <Github className="h-5 w-5" />
                        </a>
                      )}
                      {member.twitter_url && (
                        <a
                          href={member.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {team.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center">Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member) => (
                <div
                  key={member.id}
                  className="bg-card rounded-lg p-6 border hover:shadow-lg transition-shadow"
                >
                  {member.profile_image_url && (
                    <div className="relative h-32 w-32 mx-auto mb-4 rounded-full overflow-hidden">
                      <Image
                        src={member.profile_image_url}
                        alt={member.full_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-lg font-bold mb-1">{member.full_name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{member.position}</p>

                    {member.years_of_experience && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {member.years_of_experience} years experience
                      </p>
                    )}

                    {member.specializations && member.specializations.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {member.specializations.slice(0, 2).map((spec, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 justify-center text-muted-foreground">
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="hover:text-primary transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {member.linkedin_url && (
                        <a
                          href={member.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {member.github_url && (
                        <a
                          href={member.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {allTeam.length === 0 && (
        <section className="py-20">
          <div className="container">
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Our team information will be available soon. Check back later!
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
