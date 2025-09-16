// Service categories and descriptions for Kamisoft Enterprises

import type { ServiceCategory } from "@/lib/types/database"

export const SERVICE_CATEGORIES: Record<
  ServiceCategory,
  {
    label: string
    description: string
    icon: string
    features: string[]
  }
> = {
  full_stack_development: {
    label: "Full-Stack Development",
    description: "End-to-end web application development with modern technologies",
    icon: "💻",
    features: [
      "React/Next.js Frontend",
      "Node.js/Python Backend",
      "Database Design",
      "API Development",
      "Cloud Deployment",
    ],
  },
  mobile_app_development: {
    label: "Mobile App Development",
    description: "Native and cross-platform mobile applications for iOS and Android",
    icon: "📱",
    features: [
      "React Native",
      "Flutter Development",
      "Native iOS/Android",
      "App Store Deployment",
      "Push Notifications",
    ],
  },
  blockchain_solutions: {
    label: "Blockchain Solutions",
    description: "Decentralized applications and smart contract development",
    icon: "⛓️",
    features: [
      "Smart Contracts",
      "DeFi Applications",
      "NFT Platforms",
      "Cryptocurrency Integration",
      "Web3 Development",
    ],
  },
  fintech_platforms: {
    label: "Fintech Platforms",
    description: "Financial technology solutions and payment systems",
    icon: "💳",
    features: [
      "Payment Gateways",
      "Digital Wallets",
      "Trading Platforms",
      "Banking Solutions",
      "Compliance & Security",
    ],
  },
  networking_ccna: {
    label: "Networking & CCNA",
    description: "Network infrastructure setup and Cisco certified solutions",
    icon: "🌐",
    features: [
      "Network Design",
      "CCNA Implementation",
      "Security Configuration",
      "Performance Optimization",
      "Maintenance & Support",
    ],
  },
  consultancy: {
    label: "Consultancy Services",
    description: "Technology consulting and digital transformation guidance",
    icon: "🎯",
    features: [
      "Technology Strategy",
      "Digital Transformation",
      "Architecture Review",
      "Performance Audits",
      "Best Practices",
    ],
  },
  cloud_devops: {
    label: "Cloud & DevOps",
    description: "Cloud infrastructure and DevOps automation solutions",
    icon: "☁️",
    features: [
      "AWS/Azure/GCP",
      "CI/CD Pipelines",
      "Container Orchestration",
      "Infrastructure as Code",
      "Monitoring & Logging",
    ],
  },
  ai_automation: {
    label: "AI & Automation",
    description: "Artificial intelligence and process automation solutions",
    icon: "🤖",
    features: [
      "Machine Learning",
      "Process Automation",
      "Chatbots & AI Assistants",
      "Data Analytics",
      "Predictive Modeling",
    ],
  },
}

export const COMPANY_INFO = {
  name: "Kamisoft Enterprises",
  tagline: "From Code to Connectivity—We Build It All",
  description:
    "Kamisoft Enterprises is a technology company offering bespoke solutions across fintech, gaming, and enterprise software.",
  founded: 2015,
  location: "Nigeria",
  parentCompany: "Amor Group",

  contact: {
    email: "hello@kamisoftenterprises.online",
    phone: "+234 XXX XXX XXXX", // To be updated
    address: "Lagos, Nigeria",
  },

  social: {
    linkedin: "https://linkedin.com/company/kamisoft-enterprises",
    twitter: "https://twitter.com/kamisoft",
    github: "https://github.com/kamisoft",
  },
}
