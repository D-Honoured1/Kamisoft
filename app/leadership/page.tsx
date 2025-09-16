import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Linkedin, Twitter } from "lucide-react"
import Link from "next/link"

export default function LeadershipPage() {
  // This would normally come from the database
  const leadershipTeam = [
    {
      id: "1",
      name: "Daniel Austen",
      position: "Chief Executive Officer",
      bio: "Visionary leader with over 10 years of experience in technology and business development. Founded Kamisoft Enterprises in 2015 with a mission to deliver cutting-edge software solutions across Africa and beyond.",
      email: "danielausten@kamisoftenterprises.online",
      linkedin_url: "https://linkedin.com/in/daniel-austen",
      twitter_url: "https://twitter.com/daniel_austen",
      profile_image_url: "/professional-ceo-portrait.png",
      display_order: 1,
    },
    {
      id: "2",
      name: "Sarah Johnson",
      position: "Chief Operating Officer",
      bio: "Operations expert with extensive experience in scaling technology companies. Ensures smooth delivery of all client projects and manages our growing team of developers.",
      email: "sarah@kamisoftenterprises.online",
      linkedin_url: "https://linkedin.com/in/sarah-johnson",
      twitter_url: "https://twitter.com/sarah_johnson",
      profile_image_url: "/professional-coo-portrait.png",
      display_order: 2,
    },
    {
      id: "3",
      name: "Michael Chen",
      position: "Chief Technology Officer",
      bio: "Technical architect with deep expertise in full-stack development, blockchain, and AI. Leads our technical strategy and ensures we stay at the forefront of technology trends.",
      email: "michael@kamisoftenterprises.online",
      linkedin_url: "https://linkedin.com/in/michael-chen",
      twitter_url: "https://twitter.com/michael_chen",
      profile_image_url: "/professional-cto-portrait.png",
      display_order: 3,
    },
  ]

  const departments = [
    {
      name: "Development Team",
      description: "Our core development team consists of 13 skilled developers specializing in various technologies",
      count: 13,
      specializations: ["Full-Stack Development", "Mobile Development", "Blockchain", "AI/ML", "DevOps"],
    },
    {
      name: "Design & UX",
      description: "Creative professionals focused on user experience and interface design",
      count: 2,
      specializations: ["UI/UX Design", "Product Design", "Brand Identity"],
    },
    {
      name: "Project Management",
      description: "Experienced project managers ensuring timely delivery and client satisfaction",
      count: 1,
      specializations: ["Agile Methodology", "Client Relations", "Quality Assurance"],
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              Leadership Team
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              Meet the Leaders Behind
              <span className="text-primary"> Kamisoft</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
              Our experienced leadership team combines technical expertise with business acumen to drive innovation and
              deliver exceptional results for our clients.
            </p>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Executive Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The visionaries leading Kamisoft Enterprises to new heights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {leadershipTeam.map((leader) => (
              <Card
                key={leader.id}
                className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 text-center"
              >
                <CardHeader className="pb-4">
                  <div className="mx-auto w-32 h-32 rounded-full overflow-hidden mb-6 bg-muted/50">
                    <img
                      src={leader.profile_image_url || "/placeholder.svg"}
                      alt={leader.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardTitle className="text-xl">{leader.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">{leader.position}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">{leader.bio}</p>

                  <div className="flex justify-center space-x-4">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`mailto:${leader.email}`}>
                        <Mail className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={leader.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={leader.twitter_url} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Structure */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Our Team Structure</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              16 dedicated professionals working together to deliver excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {departments.map((department, index) => (
              <Card key={index} className="border-0 bg-background/50 text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">{department.count}</span>
                  </div>
                  <CardTitle className="text-xl">{department.name}</CardTitle>
                  <CardDescription className="text-sm">{department.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Specializations
                    </h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {department.specializations.map((spec, specIndex) => (
                        <Badge key={specIndex} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Culture */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">Our Culture</h2>
              <p className="text-xl text-muted-foreground">
                What makes Kamisoft a great place to work and partner with
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">Innovation First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We foster a culture of continuous learning and innovation. Our team stays updated with the latest
                  technologies and best practices to deliver cutting-edge solutions.
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">Client Partnership</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We believe in building long-term partnerships with our clients. Every project is approached with
                  dedication, transparency, and a commitment to exceeding expectations.
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">Quality Excellence</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Quality is at the heart of everything we do. From code reviews to user testing, we maintain rigorous
                  standards to ensure reliable, scalable solutions.
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold">Team Growth</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We invest in our team's professional development through training, conferences, and mentorship
                  programs, ensuring everyone grows alongside the company.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">Want to Work With Us?</h2>
            <p className="text-xl text-muted-foreground">
              Whether you're looking to join our team or partner with us on a project, we'd love to hear from you
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Get In Touch</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/services">View Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
