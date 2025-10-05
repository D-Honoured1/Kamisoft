import { getFAQsByCategory } from "@/lib/queries/content"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata = {
  title: "Frequently Asked Questions | Kamisoft Enterprises",
  description:
    "Find answers to common questions about our services, pricing, process, and more.",
}

export default async function FAQPage() {
  const faqsByCategory = await getFAQsByCategory()

  return (
    <div className="flex flex-col">
      <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="text-sm">
              Frequently Asked Questions
            </Badge>

            <h1 className="text-4xl lg:text-6xl font-bold text-balance">
              How Can We <span className="text-primary">Help You?</span>
            </h1>

            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Find answers to common questions about our services, pricing, and development process.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-4xl">
          {Object.entries(faqsByCategory).length > 0 ? (
            Object.entries(faqsByCategory).map(([category, faqs]) => (
              <div key={category} className="mb-12">
                <h2 className="text-2xl font-bold mb-6 capitalize">
                  {category.replace(/_/g, " ")}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {faqs.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="border rounded-lg px-6"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          className="prose prose-sm max-w-none text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No FAQs published yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
