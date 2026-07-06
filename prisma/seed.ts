import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import bcrypt from "bcryptjs"
import path from "path"

const adapter = new PrismaBetterSqlite3({ url: path.resolve(__dirname, "dev.db") })
const prisma = new PrismaClient({ adapter } as any)

// ─── Image library ─────────────────────────────────────────────────────────
// All photos from Unsplash (free to use). Cropped to 400×400 card format.
const IMG = {
  // Basketball
  nba1: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop",
  nba2: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400&h=400&fit=crop",
  nba3: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=400&h=400&fit=crop",
  nba4: "https://images.unsplash.com/photo-1574627482534-3da74de74fac?w=400&h=400&fit=crop",

  // Baseball
  mlb1: "https://images.unsplash.com/photo-1508344928928-7165b67de128?w=400&h=400&fit=crop",
  mlb2: "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=400&h=400&fit=crop",
  mlb3: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=400&fit=crop",
  mlb4: "https://images.unsplash.com/photo-1529901893947-5ad31c3b79b9?w=400&h=400&fit=crop",

  // Football
  nfl1: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=400&fit=crop",
  nfl2: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=400&fit=crop",
  nfl3: "https://images.unsplash.com/photo-1615731416399-8c0b748ff3e1?w=400&h=400&fit=crop",

  // Hockey
  nhl1: "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=400&h=400&fit=crop",
  nhl2: "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?w=400&h=400&fit=crop",

  // Pokémon / TCG
  poke1: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=400&fit=crop",
  poke2: "https://images.unsplash.com/photo-1628603335495-8c60aa77c3df?w=400&h=400&fit=crop",
  poke3: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=400&fit=crop",
  poke4: "https://images.unsplash.com/photo-1642838853280-1de0d62cbf86?w=400&h=400&fit=crop",

  // Memorabilia / Autographs
  memo1: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=400&fit=crop",
  memo2: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=400&fit=crop",
  memo3: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop",
  auto1: "https://images.unsplash.com/photo-1589156288859-f0cb0d82b065?w=400&h=400&fit=crop",
  auto2: "https://images.unsplash.com/photo-1612392166886-ee8475b03af2?w=400&h=400&fit=crop",

  // Card packs / boxes
  pack1: "https://images.unsplash.com/photo-1601591963658-bca9b4d9a505?w=400&h=400&fit=crop",
  pack2: "https://images.unsplash.com/photo-1610982955706-2a8a9f5b7bc4?w=400&h=400&fit=crop",

  // Grading slabs (clear acrylic/trophy vibes)
  slab1: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=400&h=400&fit=crop",
  slab2: "https://images.unsplash.com/photo-1542621334-a254cf47733d?w=400&h=400&fit=crop",
  slab3: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",

  // User avatars (portrait style)
  avatar_alice:   "https://images.unsplash.com/photo-1494790108755-2616b612b188?w=200&h=200&fit=crop&crop=face",
  avatar_bob:     "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
  avatar_carlos:  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  avatar_diana:   "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  avatar_ethan:   "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  avatar_fiona:   "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
  avatar_greg:    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
  avatar_hannah:  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face",
  avatar_ivan:    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face",
  avatar_julia:   "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face",
}

const img = (...keys: (keyof typeof IMG)[]) => JSON.stringify(keys.map((k) => IMG[k]))

// ─── Seed ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding GrailMarket database...")

  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.rating.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.savedOffer.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.offer.deleteMany()
  await prisma.grailRequest.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  const pw = await bcrypt.hash("password123", 10)

  // ─── Users ──────────────────────────────────────────────────────────────
  const [alice, bob, carlos, diana, ethan, fiona, greg, hannah, ivan, julia] =
    await Promise.all([
      prisma.user.create({ data: { name: "Alice Thompson", email: "alice@grailmarket.io", password: pw, role: "BUYER", verified: true, bio: "Chasing BGS 10s since 2015. Mostly NBA and Pokémon.", location: "New York, NY", image: IMG.avatar_alice } }),
      prisma.user.create({ data: { name: "Bob Martinez",   email: "bob@grailmarket.io",   password: pw, role: "BUYER", verified: true, bio: "Vintage baseball card collector. Always after pre-war.", location: "Chicago, IL", image: IMG.avatar_bob } }),
      prisma.user.create({ data: { name: "Carlos Rivera",  email: "carlos@grailmarket.io", password: pw, role: "BUYER", bio: "NFL superfan — Cowboys and Steelers.", location: "Dallas, TX", image: IMG.avatar_carlos } }),
      prisma.user.create({ data: { name: "Diana Chen",     email: "diana@grailmarket.io",  password: pw, role: "BUYER", verified: true, bio: "Pokémon WOTC collector. Looking for Base Set gems.", location: "San Francisco, CA", image: IMG.avatar_diana } }),
      prisma.user.create({ data: { name: "Ethan Brooks",   email: "ethan@grailmarket.io",  password: pw, role: "SELLER", verified: true, verifiedSeller: true, bio: "10+ years in the hobby. Specialise in high-grade basketball and baseball.", location: "Los Angeles, CA", successfulSales: 247, image: IMG.avatar_ethan } }),
      prisma.user.create({ data: { name: "Fiona Walsh",    email: "fiona@grailmarket.io",  password: pw, role: "SELLER", verified: true, verifiedSeller: true, bio: "Pokémon and TCG specialist. All cards sleeved and shipped with love.", location: "Seattle, WA", successfulSales: 183, image: IMG.avatar_fiona } }),
      prisma.user.create({ data: { name: "Greg Nakamura",  email: "greg@grailmarket.io",   password: pw, role: "SELLER", verifiedSeller: true, bio: "Sports memorabilia dealer. Authentic pieces only, COA on everything.", location: "Boston, MA", successfulSales: 94, image: IMG.avatar_greg } }),
      prisma.user.create({ data: { name: "Hannah Lee",     email: "hannah@grailmarket.io", password: pw, role: "SELLER", verified: true, bio: "Football card collector turned seller. PSA submissions every month.", location: "Miami, FL", successfulSales: 61, image: IMG.avatar_hannah } }),
      prisma.user.create({ data: { name: "Ivan Petrov",    email: "ivan@grailmarket.io",   password: pw, role: "BUYER", bio: "Hockey fan. Looking for Gretzky and Lemieux RCs.", location: "Toronto, ON", image: IMG.avatar_ivan } }),
      prisma.user.create({ data: { name: "Julia Santos",   email: "julia@grailmarket.io",  password: pw, role: "SELLER", verifiedSeller: true, bio: "MLB specialist. T206 Honus Wagner is my white whale.", location: "Phoenix, AZ", successfulSales: 38, image: IMG.avatar_julia } }),
    ])

  console.log("  ✓ Users created (with avatars)")

  // ─── Grail Requests ──────────────────────────────────────────────────────
  const grails = await Promise.all([
    // Alice — NBA
    prisma.grailRequest.create({ data: {
      title: "2003-04 Topps Chrome LeBron James Rookie BGS 9.5",
      description: "Looking for a BGS 9.5 or better on the Topps Chrome RC. Prefer black label but will consider strong 9.5s. No visible scratches on the case please. This is my holy grail and I am serious about buying.",
      category: "sports-cards-nba", condition: "mint", budgetMin: 4000, budgetMax: 6500,
      images: img("nba1", "slab1", "nba2"),
      status: "ACTIVE", views: 312, userId: alice.id,
    }}),
    prisma.grailRequest.create({ data: {
      title: "2003-04 Upper Deck Exquisite LeBron James /99 PSA 8+",
      description: "The Exquisite Collection RC #/99. PSA 8 minimum. Prefer PSA 9. I know these are rare but I'm patient. Centering doesn't have to be perfect but no edge chips.",
      category: "sports-cards-nba", condition: "near-mint", budgetMin: 8000, budgetMax: 15000,
      images: img("nba3", "slab2"),
      status: "ACTIVE", views: 189, userId: alice.id,
    }}),
    // Bob — MLB
    prisma.grailRequest.create({ data: {
      title: "1952 Topps Mickey Mantle #311 PSA 4 or Better",
      description: "The king of the hobby. Looking for a PSA 4 (VG-EX) or better. Centering can be off but I need 4 sharp corners. No creases through the face. This is my lifelong dream card.",
      category: "sports-cards-mlb", condition: "good", budgetMin: 25000, budgetMax: 55000,
      images: img("mlb1", "slab1", "mlb3"),
      status: "ACTIVE", views: 891, userId: bob.id,
    }}),
    prisma.grailRequest.create({ data: {
      title: "1909-11 T206 Honus Wagner (Any Grade)",
      description: "Yes, I know. The T206 Wagner. Any authentic grade accepted — even a 1. Trimmed cards considered at reduced price. If you have one, contact me. Serious buyer only.",
      category: "sports-cards-mlb", condition: "any", budgetMin: 500000, budgetMax: 1000000,
      images: img("mlb2", "mlb4"),
      status: "ACTIVE", views: 2341, userId: bob.id,
    }}),
    // Carlos — NFL
    prisma.grailRequest.create({ data: {
      title: "2000 Playoff Contenders Tom Brady Rookie Auto /100 PSA 8",
      description: "The GOAT's rookie auto. Looking for PSA 8 minimum on the card with PSA 10 auto. I've been searching for 2 years and I'm ready to move fast for the right card.",
      category: "sports-cards-nfl", condition: "near-mint", budgetMin: 15000, budgetMax: 30000,
      images: img("nfl1", "slab3", "nfl2"),
      status: "ACTIVE", views: 754, userId: carlos.id,
    }}),
    prisma.grailRequest.create({ data: {
      title: "1998 Playoff Contenders Peyton Manning Rookie Auto /1000",
      description: "Manning's iconic rookie auto ticket. PSA 9+ on card, PSA 10 auto. Blue ink preferred. Will pay quickly for the right piece.",
      category: "sports-cards-nfl", condition: "mint", budgetMin: 2000, budgetMax: 4500,
      images: img("nfl3", "slab1"),
      status: "ACTIVE", views: 213, userId: carlos.id,
    }}),
    // Diana — Pokémon
    prisma.grailRequest.create({ data: {
      title: "1st Edition Base Set Charizard Holo BGS 9+ or PSA 9",
      description: "The holy grail of Pokémon. 1st Edition Shadowless Charizard. Need BGS 9 or PSA 9 minimum. Would consider BGS 9.5 at right price. NOT looking for Unlimited or Shadowless non-1st ed.",
      category: "pokemon", condition: "mint", budgetMin: 15000, budgetMax: 35000,
      images: img("poke1", "poke2", "slab2"),
      status: "ACTIVE", views: 1203, userId: diana.id,
    }}),
    prisma.grailRequest.create({ data: {
      title: "WOTC Base Set Shadowless Blastoise & Venusaur Holo PSA 9",
      description: "Completing my shadowless holo set. Need both Blastoise and Venusaur in PSA 9. Will buy separately or as a pair.",
      category: "pokemon", condition: "near-mint", budgetMin: 800, budgetMax: 2000,
      images: img("poke3", "poke4"),
      status: "ACTIVE", views: 342, userId: diana.id,
    }}),
    // Ivan — NHL
    prisma.grailRequest.create({ data: {
      title: "1979-80 O-Pee-Chee Wayne Gretzky Rookie PSA 6+",
      description: "The Great One's rookie card. PSA 6 minimum. Centering 60/40 or better. No visible surface scratches. If you have a PSA 8 or higher I'd consider stretching the budget.",
      category: "sports-cards-nhl", condition: "excellent", budgetMin: 3000, budgetMax: 9000,
      images: img("nhl1", "slab3"),
      status: "ACTIVE", views: 567, userId: ivan.id,
    }}),
    // Alice — completed
    prisma.grailRequest.create({ data: {
      title: "2018-19 Prizm Luka Doncic Rookie PSA 10 Silver",
      description: "PSA 10 Silver Prizm RC. Budget is firm. Prefer base silver but will consider gold if price is right.",
      category: "sports-cards-nba", condition: "mint", budgetMin: 2500, budgetMax: 4000,
      images: img("nba4", "slab2"),
      status: "COMPLETED", views: 428, userId: alice.id,
    }}),
    // Carlos — in progress
    prisma.grailRequest.create({ data: {
      title: "2017 National Treasures Patrick Mahomes Rookie Patch Auto /99",
      description: "Mahomes's most iconic rookie. On-card auto, multi-color patch preferred. PSA or BGS graded.",
      category: "sports-cards-nfl", condition: "mint", budgetMin: 12000, budgetMax: 20000,
      images: img("nfl1", "nfl3", "slab1"),
      status: "IN_PROGRESS", views: 892, userId: carlos.id,
    }}),
    // Memorabilia
    prisma.grailRequest.create({ data: {
      title: "Michael Jordan 1996 NBA Finals Game-Used Jersey COA",
      description: "Bulls red jersey from the 1996 Finals. Must come with JSA or PSA/DNA letter COA. Provenance documentation is non-negotiable.",
      category: "sports-memorabilia", condition: "any", budgetMin: 30000, budgetMax: 75000,
      images: img("memo1", "memo2"),
      status: "ACTIVE", views: 1102, userId: alice.id,
    }}),
    // Autograph
    prisma.grailRequest.create({ data: {
      title: "Ted Williams Signed Baseball JSA Authenticated",
      description: "Single-signed OAL baseball by Ted Williams. Must have JSA or PSA/DNA sticker. Sweet spot preferred. Clean signature, no fading.",
      category: "autographs", condition: "excellent", budgetMin: 1500, budgetMax: 3500,
      images: img("auto1", "auto2"),
      status: "ACTIVE", views: 231, userId: bob.id,
    }}),
    // Card Packs
    prisma.grailRequest.create({ data: {
      title: "1986-87 Fleer Basketball Sealed Wax Pack (Jordan Rookie Year)",
      description: "Sealed wax pack from the 1986-87 Fleer basketball set. Extremely rare sealed. Will pay well for authenticated sealed packs.",
      category: "card-packs", condition: "any", budgetMin: 5000, budgetMax: 20000,
      images: img("pack1", "pack2"),
      status: "ACTIVE", views: 445, userId: bob.id,
    }}),
  ])

  console.log("  ✓ Grail requests created (with images)")

  // ─── Offers ───────────────────────────────────────────────────────────────
  const offers = await Promise.all([
    // On LeBron Chrome (grails[0])
    prisma.offer.create({ data: {
      price: 4800, description: "BGS 9.5 Topps Chrome LeBron RC. Subs: 9/9.5/9/9. Clean case, no scratches. Purchased from PWCC auction 2022.", condition: "mint",
      images: img("nba1", "slab1"),
      status: "PENDING", grailRequestId: grails[0].id, sellerId: ethan.id,
    }}),
    prisma.offer.create({ data: {
      price: 5200, description: "Also have a BGS 9.5 — subs 9.5/9/9/9.5, stronger than typical. Centering is excellent. From a collection I purchased in full last year.", condition: "mint",
      images: img("nba2", "slab2"),
      status: "PENDING", grailRequestId: grails[0].id, sellerId: julia.id,
    }}),
    prisma.offer.create({ data: {
      price: 6200, description: "BGS 10 Black Label Topps Chrome LeBron. Subs: 10/10/10/10. Pulled from the pack personally in 2003. One of only a handful known.", condition: "mint",
      images: img("nba3", "slab3", "nba4"),
      status: "PENDING", grailRequestId: grails[0].id, sellerId: fiona.id,
    }}),

    // On 1952 Mantle (grails[2])
    prisma.offer.create({ data: {
      price: 28000, description: "PSA 4 (VG-EX). Four sharp corners, no creases on face. Light wear consistent with grade. Registered mail, full insurance.", condition: "good",
      images: img("mlb1", "slab1"),
      status: "PENDING", grailRequestId: grails[2].id, sellerId: ethan.id,
    }}),
    prisma.offer.create({ data: {
      price: 45000, description: "PSA 5 EX. Upgrade from your ask. Four nice corners, clean back, strong color. Centering 65/35 T/B. Serious upgrade opportunity.", condition: "excellent",
      images: img("mlb3", "mlb4", "slab2"),
      status: "PENDING", grailRequestId: grails[2].id, sellerId: julia.id,
    }}),

    // On Brady Contenders (grails[4]) — accepted
    prisma.offer.create({ data: {
      price: 18500, description: "PSA 8 card, PSA 10 auto. Black ink. Centering solid 55/45. Auto is clean and full. Provenance available on request.", condition: "near-mint",
      images: img("nfl1", "slab3", "nfl2"),
      status: "ACCEPTED", grailRequestId: grails[4].id, sellerId: ethan.id,
    }}),

    // On 1st Ed Charizard (grails[6])
    prisma.offer.create({ data: {
      price: 18000, description: "1st Edition BGS 9. Subs: 9.5/8.5/9/9. Beautiful centering, great gloss. The half grade on the surface keeps it from 9.5 but presents incredibly well in-hand.", condition: "mint",
      images: img("poke1", "poke2", "slab1"),
      status: "PENDING", grailRequestId: grails[6].id, sellerId: fiona.id,
    }}),
    prisma.offer.create({ data: {
      price: 16500, description: "PSA 9 1st Edition Charizard. Strong 9 — great population. Clean face, tight corners. Shipped in pop-protector inside a card saver inside a bubble mailer.", condition: "mint",
      images: img("poke3", "slab2"),
      status: "PENDING", grailRequestId: grails[6].id, sellerId: julia.id,
    }}),
    prisma.offer.create({ data: {
      price: 14800, description: "PSA 9 1st Ed. Not as strong as some 9s but fairly priced. Need to move collection and priced to sell fast.", condition: "near-mint",
      images: img("poke4", "slab3"),
      status: "DECLINED", grailRequestId: grails[6].id, sellerId: greg.id,
    }}),

    // On Gretzky (grails[8])
    prisma.offer.create({ data: {
      price: 5500, description: "PSA 7 NM. Tough card to find in high grade. 4 sharp corners, excellent surface, centering 60/40. Straight from a collection I acquired in Toronto.", condition: "near-mint",
      images: img("nhl1", "nhl2", "slab1"),
      status: "PENDING", grailRequestId: grails[8].id, sellerId: ethan.id,
    }}),

    // On Luka Prizm (grails[9]) — accepted + completed
    prisma.offer.create({ data: {
      price: 2800, description: "PSA 10 Silver Prizm Luka RC. Gem mint all day. Clean, sharp example. Shipped with full insurance.", condition: "mint",
      images: img("nba4", "slab2"),
      status: "ACCEPTED", grailRequestId: grails[9].id, sellerId: hannah.id,
    }}),

    // On Jordan Jersey (grails[11])
    prisma.offer.create({ data: {
      price: 52000, description: "Bulls game-worn jersey from 1996 Finals, Game 3. Full photo-match documentation with JSA letter of authenticity. One of my prized pieces I'm finally parting with.", condition: "excellent",
      images: img("memo1", "memo3", "memo2"),
      status: "PENDING", grailRequestId: grails[11].id, sellerId: greg.id,
    }}),
  ])

  console.log("  ✓ Offers created (with images)")

  // ─── Conversations + Messages ─────────────────────────────────────────────
  const convs = await Promise.all(
    offers.map((o) => prisma.conversation.create({ data: { offerId: o.id } }))
  )

  // LeBron thread (Ethan ↔ Alice)
  await Promise.all([
    prisma.message.create({ data: { content: "Hi Ethan! Can you share more photos of the corners and surface under bright light?", senderId: alice.id, conversationId: convs[0].id, read: true } }),
    prisma.message.create({ data: { content: "Of course! I can also do a video call. The 9 sub on the back-left corner is totally clean in person — just the grader being conservative.", senderId: ethan.id, conversationId: convs[0].id, read: true } }),
    prisma.message.create({ data: { content: "That would be amazing. Are you open to $4,600 as a final number? I've been searching for this one for two years.", senderId: alice.id, conversationId: convs[0].id, read: true } }),
    prisma.message.create({ data: { content: "I appreciate the offer. The card market has been strong lately — $4,800 is genuinely fair given the subs. Let me know if you want that video call first!", senderId: ethan.id, conversationId: convs[0].id, read: false } }),
  ])

  // Charizard thread (Fiona ↔ Diana)
  await Promise.all([
    prisma.message.create({ data: { content: "Hi Fiona, the BGS 9 Zard looks great. Is the card from the original printing?", senderId: diana.id, conversationId: convs[6].id, read: true } }),
    prisma.message.create({ data: { content: "100% authentic first printing. I purchased it from a prominent collection sale in 2019. Have the original invoice.", senderId: fiona.id, conversationId: convs[6].id, read: true } }),
    prisma.message.create({ data: { content: "Perfect. What are the centering measurements on the front?", senderId: diana.id, conversationId: convs[6].id, read: true } }),
    prisma.message.create({ data: { content: "Front is ~55/45 L/R and 60/40 T/B. Very strong for a 9.5 centering sub. The surface half-grade is purely micro scratches visible only under harsh direct light.", senderId: fiona.id, conversationId: convs[6].id, read: false } }),
    prisma.message.create({ data: { content: "That sounds incredible. Would you take $17,500?", senderId: diana.id, conversationId: convs[6].id, read: false } }),
  ])

  // Brady deal — accepted (Ethan ↔ Carlos)
  await Promise.all([
    prisma.message.create({ data: { content: "Ethan, I accept your offer on the Brady Contenders. Ready to move to payment!", senderId: carlos.id, conversationId: convs[5].id, read: true } }),
    prisma.message.create({ data: { content: "Fantastic! Super excited for this to go to a great collection. I'll ship within 24 hours of payment clearing. Full insurance, signature required.", senderId: ethan.id, conversationId: convs[5].id, read: true } }),
    prisma.message.create({ data: { content: "Sounds perfect. Proceeding to checkout now.", senderId: carlos.id, conversationId: convs[5].id, read: true } }),
  ])

  console.log("  ✓ Conversations & messages created")

  // ─── Ratings ──────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.rating.create({ data: { score: 5, comment: "Ethan is the real deal. Card was exactly as described, shipped fast, communication was excellent. Will buy again.", giverId: alice.id, receiverId: ethan.id } }),
    prisma.rating.create({ data: { score: 5, comment: "Went above and beyond — video call before purchase, perfect packing, arrived 2 days early.", giverId: bob.id, receiverId: ethan.id } }),
    prisma.rating.create({ data: { score: 5, comment: "Super smooth transaction. Honest description, fast shipper.", giverId: diana.id, receiverId: ethan.id } }),
    prisma.rating.create({ data: { score: 4, comment: "Good seller. Took slightly longer to ship than expected but card was exactly as described.", giverId: ivan.id, receiverId: ethan.id } }),
    prisma.rating.create({ data: { score: 5, comment: "Fiona is my go-to Pokémon seller. Knows the hobby inside out, cards always perfect.", giverId: diana.id, receiverId: fiona.id } }),
    prisma.rating.create({ data: { score: 5, comment: "Best Pokémon transaction I've had. Prompt communication and perfect packaging.", giverId: alice.id, receiverId: fiona.id } }),
    prisma.rating.create({ data: { score: 5, comment: "Top-tier seller. Would recommend to any collector.", giverId: carlos.id, receiverId: fiona.id } }),
    prisma.rating.create({ data: { score: 5, comment: "Memorabilia from Greg always comes with impeccable documentation. 100% legit.", giverId: alice.id, receiverId: greg.id } }),
    prisma.rating.create({ data: { score: 4, comment: "Great piece, COA was solid. Would have appreciated more photos before purchase.", giverId: bob.id, receiverId: greg.id } }),
    prisma.rating.create({ data: { score: 5, comment: "Fast, honest, well-priced. Great seller.", giverId: carlos.id, receiverId: hannah.id } }),
    prisma.rating.create({ data: { score: 4, comment: "Solid seller. Card was accurately graded and shipped safely.", giverId: ivan.id, receiverId: julia.id } }),
    prisma.rating.create({ data: { score: 5, comment: "Alice pays fast and communicates clearly. Ideal buyer.", giverId: ethan.id, receiverId: alice.id } }),
    prisma.rating.create({ data: { score: 5, comment: "Carlos is a dream buyer — accepted quickly and paid same day.", giverId: ethan.id, receiverId: carlos.id } }),
  ])

  console.log("  ✓ Ratings created")

  // ─── Notifications ────────────────────────────────────────────────────────
  await Promise.all([
    prisma.notification.create({ data: { type: "NEW_OFFER", title: "New Offer Received", message: 'Ethan Brooks made an offer of $4,800 on "2003-04 Topps Chrome LeBron James Rookie BGS 9.5"', link: `/grails/${grails[0].id}`, userId: alice.id } }),
    prisma.notification.create({ data: { type: "NEW_OFFER", title: "New Offer Received", message: 'Julia Santos made an offer of $5,200 on "2003-04 Topps Chrome LeBron James Rookie BGS 9.5"', link: `/grails/${grails[0].id}`, userId: alice.id } }),
    prisma.notification.create({ data: { type: "NEW_OFFER", title: "New Offer Received", message: 'Fiona Walsh made an offer of $6,200 (Black Label!) on "2003-04 Topps Chrome LeBron James Rookie BGS 9.5"', link: `/grails/${grails[0].id}`, userId: alice.id } }),
    prisma.notification.create({ data: { type: "NEW_OFFER", title: "New Offer Received", message: 'Fiona Walsh made an offer of $18,000 on "1st Edition Base Set Charizard Holo BGS 9+"', link: `/grails/${grails[6].id}`, userId: diana.id } }),
    prisma.notification.create({ data: { type: "NEW_OFFER", title: "New Offer Received", message: 'Ethan Brooks made an offer of $28,000 on "1952 Topps Mickey Mantle #311 PSA 4"', link: `/grails/${grails[2].id}`, userId: bob.id } }),
    prisma.notification.create({ data: { type: "OFFER_ACCEPTED", title: "Offer Accepted! 🎉", message: 'Carlos Rivera accepted your $18,500 offer on "2000 Playoff Contenders Tom Brady Rookie Auto"', link: `/grails/${grails[4].id}`, userId: ethan.id } }),
    prisma.notification.create({ data: { type: "NEW_MESSAGE", title: "New Message", message: "Ethan Brooks replied to your question about the LeBron Topps Chrome", link: `/messages/${convs[0].id}`, read: false, userId: alice.id } }),
    prisma.notification.create({ data: { type: "NEW_MESSAGE", title: "New Message", message: "Fiona Walsh answered your centering question about the 1st Ed Charizard", link: `/messages/${convs[6].id}`, read: false, userId: diana.id } }),
    prisma.notification.create({ data: { type: "OFFER_DECLINED", title: "Offer Declined", message: 'Diana Chen declined your offer on "1st Edition Base Set Charizard"', link: `/grails/${grails[6].id}`, read: true, userId: greg.id } }),
  ])

  console.log("  ✓ Notifications created")

  // ─── Transactions ─────────────────────────────────────────────────────────
  await Promise.all([
    prisma.transaction.create({ data: { offerId: offers[10].id, amount: 2800, platformFee: 252, sellerPayout: 2548, status: "COMPLETED", stripePaymentId: "pi_mock_luka_001" } }),
  ])

  console.log("  ✓ Transactions created")

  // ─── Inventory Items (for sellers) ───────────────────────────────────────
  await Promise.all([
    prisma.inventoryItem.create({ data: { title: "2019-20 Prizm Zion Williamson RC PSA 10", description: "Gem Mint PSA 10. Base silver prizm. Perfectly centered. Investment grade.", category: "sports-cards-nba", condition: "mint", price: 1800, images: JSON.stringify([IMG.nba1, IMG.slab2]), sellerId: ethan.id } }),
    prisma.inventoryItem.create({ data: { title: "2021 Topps Chrome Mickey Mantle 1952 Reprint BGS 9.5", description: "Beautiful BGS 9.5 on the Mantle reprint. Subs 9/9.5/9/9.5. Great eye appeal.", category: "sports-cards-mlb", condition: "mint", price: 350, images: JSON.stringify([IMG.mlb1, IMG.slab1]), sellerId: ethan.id } }),
    prisma.inventoryItem.create({ data: { title: "1999 Pokemon Base Set 2 Charizard Holo Unlimited PSA 8", description: "PSA 8 Charizard from Base Set 2. Great centering, minor surface wear consistent with grade.", category: "pokemon", condition: "excellent", price: 280, images: JSON.stringify([IMG.poke1, IMG.slab3]), sellerId: fiona.id } }),
    prisma.inventoryItem.create({ data: { title: "1st Edition Pokemon Jungle Set Sealed Booster Pack", description: "Sealed WOTC 1st Edition Jungle booster pack. Unweighed. Ships in rigid mailer.", category: "card-packs", condition: "mint", price: 450, images: JSON.stringify([IMG.poke2, IMG.pack1]), sellerId: fiona.id } }),
    prisma.inventoryItem.create({ data: { title: "Michael Jordan 1986-87 Fleer #57 PSA 6", description: "Jordan's rookie card. PSA 6 EX-MT. Four sharp corners. Honest grade, well-centered.", category: "sports-cards-nba", condition: "excellent", price: 2200, images: JSON.stringify([IMG.nba3, IMG.slab1]), sellerId: julia.id } }),
    prisma.inventoryItem.create({ data: { title: "Derek Jeter 1993 SP #279 RC PSA 9 MINT", description: "Jeter RC in PSA 9. Sharp corners, clean surface, great centering. Strong investment.", category: "sports-cards-mlb", condition: "near-mint", price: 1600, images: JSON.stringify([IMG.mlb2, IMG.slab2]), sellerId: julia.id } }),
    prisma.inventoryItem.create({ data: { title: "Wayne Gretzky Signed Edmonton Oilers 8x10 Photo PSA/DNA", description: "Authenticated by PSA/DNA. Blue sharpie. Clean, bold signature. Includes COA.", category: "autographs", condition: "excellent", price: 750, images: JSON.stringify([IMG.auto1, IMG.memo1]), sellerId: greg.id } }),
    prisma.inventoryItem.create({ data: { title: "Tom Brady 2000 Playoff Contenders RC Auto #/1000 Raw", description: "Ungraded raw copy. Strong auto, no surface issues visible. Priced for quick sale.", category: "sports-cards-nfl", condition: "near-mint", price: 12500, images: JSON.stringify([IMG.nfl1, IMG.slab3]), sellerId: hannah.id, available: false } }),
  ])

  console.log("  ✓ Inventory items created")

  // ─── Search Alerts ─────────────────────────────────────────────────────────
  await Promise.all([
    prisma.searchAlert.create({ data: { keywords: "LeBron rookie chrome", category: "sports-cards-nba", budgetMax: 10000, userId: ethan.id } }),
    prisma.searchAlert.create({ data: { keywords: "charizard 1st edition PSA", category: "pokemon", userId: fiona.id } }),
    prisma.searchAlert.create({ data: { keywords: "Brady rookie auto", category: "sports-cards-nfl", budgetMax: 50000, userId: ethan.id } }),
    prisma.searchAlert.create({ data: { keywords: "Mantle Topps vintage", category: "sports-cards-mlb", userId: julia.id } }),
  ])

  console.log("  ✓ Search alerts created")

  // ─── Follows ───────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.follow.create({ data: { followerId: alice.id, followingId: ethan.id } }),
    prisma.follow.create({ data: { followerId: diana.id, followingId: fiona.id } }),
    prisma.follow.create({ data: { followerId: bob.id, followingId: ethan.id } }),
    prisma.follow.create({ data: { followerId: carlos.id, followingId: ethan.id } }),
    prisma.follow.create({ data: { followerId: alice.id, followingId: fiona.id } }),
    prisma.follow.create({ data: { followerId: ivan.id, followingId: julia.id } }),
  ])

  console.log("  ✓ Follows created")

  // ─── Counter offer example ─────────────────────────────────────────────────
  // Add a counter-offer to the declined Charizard offer (offers[8])
  await prisma.offer.update({
    where: { id: offers[8].id },
    data: { status: "COUNTERED", counterPrice: 16000, counterNote: "I can do $16,000 — this is still a strong PSA 9, purchased directly from a major auction. Happy to provide full provenance." },
  })

  console.log("  ✓ Counter offer example created")

  // ─── Summary ──────────────────────────────────────────────────────────────
  const [users, grailCount, offerCount, messages, ratings] = await Promise.all([
    prisma.user.count(), prisma.grailRequest.count(), prisma.offer.count(),
    prisma.message.count(), prisma.rating.count(),
  ])

  console.log(`
  📊 Database summary:
     Users:          ${users}
     Grail requests: ${grailCount}
     Offers:         ${offerCount}
     Messages:       ${messages}
     Ratings:        ${ratings}

  🚀 Seed complete! Login credentials (password: password123)
     alice@grailmarket.io   — Buyer (verified)
     diana@grailmarket.io   — Buyer (Pokémon collector)
     ethan@grailmarket.io   — Seller ⭐ (247 sales)
     fiona@grailmarket.io   — Seller ⭐ (183 sales)
     bob@grailmarket.io     — Buyer (vintage MLB)
     carlos@grailmarket.io  — Buyer (NFL)
  `)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
