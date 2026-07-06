import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return "just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export const CATEGORIES = [
  { value: "sports-cards-mlb", label: "MLB Sports Cards" },
  { value: "sports-cards-nba", label: "NBA Sports Cards" },
  { value: "sports-cards-nfl", label: "NFL Sports Cards" },
  { value: "sports-cards-nhl", label: "NHL Sports Cards" },
  { value: "pokemon", label: "Pokémon" },
  { value: "sports-memorabilia", label: "Sports Memorabilia" },
  { value: "autographs", label: "Autographs" },
  { value: "card-packs", label: "Card Packs & Boxes" },
  { value: "other", label: "Other Collectibles" },
]

export const CONDITIONS = [
  { value: "mint", label: "Mint (PSA 10)" },
  { value: "near-mint", label: "Near Mint (PSA 8-9)" },
  { value: "excellent", label: "Excellent (PSA 6-7)" },
  { value: "good", label: "Good (PSA 4-5)" },
  { value: "any", label: "Any Condition" },
]

export const PLATFORM_FEE = 0.09

export function calculateFees(price: number) {
  const platformFee = price * PLATFORM_FEE
  const sellerPayout = price - platformFee
  return { platformFee, sellerPayout }
}

export function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value
}

export function getConditionLabel(value: string): string {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value
}

export function sanitizeMessage(text: string): string {
  const phonePattern = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
  const socialPattern = /@[\w.]+/g

  return text
    .replace(phonePattern, "[phone removed]")
    .replace(emailPattern, "[email removed]")
    .replace(urlPattern, "[link removed]")
    .replace(socialPattern, "[handle removed]")
}

export function hasOffPlatformContent(text: string): boolean {
  const phonePattern = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
  const socialPattern = /@[\w]+/g

  return (
    phonePattern.test(text) ||
    emailPattern.test(text) ||
    urlPattern.test(text) ||
    socialPattern.test(text)
  )
}
