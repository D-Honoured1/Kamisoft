import { createServerClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Mail, Linkedin, Github, Twitter } from "lucide-react"

export const metadata = {
  title: "Our Team | Kamisoft Enterprises - Meet the Experts",
  description:
    "Meet the talented team behind Kamisoft Enterprises. Expert developers, engineers, and consultants with 9+ years of experience.",
}

export default async function TeamPage() {
  const supabase = createServerClient()

  // Get leadership from leadership_team table
  const { data: leadership, error: leadershipError } = await supabase
    .from("leadership_team")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (leadershipError) {
    console.error("Error fetching leadership:", leadershipError)
  }

  const allTeam = leadership || []
  const team: any[] = [] // No separate team members table anymore

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

      {allTeam.length > 0 && (
        <section className="py-20">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {allTeam.map((member) => (
                <div
                  key={member.id}
                  className="bg-card rounded-lg p-6 border hover:shadow-lg transition-all"
                >
                  {member.profile_image_url && (
                    <div className="relative h-48 w-48 mx-auto mb-4 rounded-full overflow-hidden">
                      <Image
                        src={member.profile_image_url}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-muted-foreground mb-2">{member.position}</p>

                    {member.bio && <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>}

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
