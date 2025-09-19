// components/service-card.tsx - Enhanced service cards with payment buttons
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaymentButton } from "@/components/payment-button"
import { SERVICE_CATEGORIES } from "@/lib/constants/services"
import { ServiceCategory } from "@/lib/types/database"

interface ServiceCardProps {
  category: ServiceCategory
  showPaymentButton?: boolean
  featured?: boolean
}

export function ServiceCard({ category, showPaymentButton = false, featured = false }: ServiceCardProps) {
  const service = SERVICE_CATEGORIES[category]
  
  if (!service) return null

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 ${featured ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors text-2xl">
          {service.icon}
        </div>
        <CardTitle className="text-lg">{service.label}</CardTitle>
        {featured && <Badge className="w-fit mx-auto">Most Popular</Badge>}
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <CardDescription className="text-sm">{service.description}</CardDescription>
        
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Key Features:
          </p>
          <div className="flex flex-wrap gap-1 justify-center">
            {service.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {service.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{service.features.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {showPaymentButton && (
          <div className="pt-2">
            <PaymentButton 
              variant="outline" 
              size="sm"
              className="w-full bg-transparent"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
