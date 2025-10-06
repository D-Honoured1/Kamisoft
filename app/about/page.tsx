import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Target, Eye, Heart } from "lucide-react"
import Link from "next/link"
import { COMPANY_INFO } from "@/lib/constants/services"

export default function AboutPage() {
  const milestones = [
    {
      year: "2015",
      title: "Company Founded",
      description: "Started as a freelance development brand, focusing on software engineering and network solutions",
    },
    {
      year: "2018",
      title: "Kamisoft Enterprises Formed",
      description: "Officially registered as Kamisoft Enterprises under Amor Group, expanding service offerings",
    },
    {
      year: "2019",
      title: "Team Expansion",
      description: "Grew to 10+ developers and expanded into blockchain and fintech solutions",
    },
    {
      year: "2021",
      title: "Enterprise Contracts",
      description: "Secured major contracts with banking and government organizations across West Africa",
    },
    {
      year: "2022",
      title: "Fintech & Blockchain Focus",
      description: "Specialized in regulated payment systems, digital wallets, and smart contract development",
    },
    {
      year: "2024",
      title: "200+ Projects Milestone",
      description: "Reached milestone of 200+ successful projects across fintech, enterprise, and government sectors",
    },
    {
      year: "2025",
      title: "Digital Expansion",
      description: "Launched official online presence at kamisoftenterprises.online to serve global clients",
    },
  ]

  const values = [
    {
      icon: Target,
      title: "Innovation",
      description: "We stay at the forefront of technology trends to deliver cutting-edge solutions",
    },
    {
      icon: Heart,
      title: "Quality",
      description: "Every project receives our full attention to detail and commitment to excellence",
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "We work closely with clients as partners to achieve their business objectives",
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              About Kamisoft Enterprises
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              Building the Future of
              <span className="text-primary"> Technology</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
              After nearly a decade delivering fintech, blockchain, cloud infrastructure, AI automation, networking (CCNA),
              and enterprise software through referrals and contracts, Kamisoft Enterprises is now online — ready to serve
              a global audience with the same excellence that built our reputation.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Founded {COMPANY_INFO.founded}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{COMPANY_INFO.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>16 Team Members</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-0 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Target className="h-6 w-6 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We exist so businesses can leverage world-class tech without complexity. Our mission is to empower
                  organizations with innovative solutions that drive measurable growth, efficiency, and digital transformation
                  across Africa and beyond.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Eye className="h-6 w-6 text-primary" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  To be the leading technology partner for businesses across Africa, recognized for our expertise in
                  fintech, blockchain, and enterprise software development. We envision a future where technology
                  seamlessly enhances every aspect of business operations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold">Our Journey</h2>
              <p className="text-xl text-muted-foreground">From a small startup to a recognized technology leader</p>
            </div>

            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {milestone.year.slice(-2)}
                    </div>
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{milestone.title}</h3>
                      <Badge variant="outline">{milestone.year}</Badge>
                    </div>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <Card key={index} className="text-center border-0 bg-card/50">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{value.description}</CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">Ready to Work Together?</h2>
            <p className="text-xl text-muted-foreground">
              Let's discuss how our experience and expertise can help transform your business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/leadership">Meet Our Team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
