/* eslint-disable */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../node_modules/.prisma/client");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Ensure .env exists at the project root.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// gold price per gram (ریال) used for seeding
const GOLD_PRICE = 75000000n;

function computeTotal({ weight, wage, profit, tax }) {
  const base = weight * Number(GOLD_PRICE);
  const wageAmount = (base * wage) / 100;
  const profitAmount = ((base + wageAmount) * profit) / 100;
  const taxAmount = ((wageAmount + profitAmount) * tax) / 100;
  return BigInt(Math.round(base + wageAmount + profitAmount + taxAmount));
}

async function main() {
  console.log("→ Seeding settings & gold price ...");
  await prisma.setting.upsert({
    where: { key: "vip_threshold" },
    update: {},
    create: { key: "vip_threshold", value: "500000000" },
  });
  await prisma.setting.upsert({
    where: { key: "store_name" },
    update: {},
    create: { key: "store_name", value: "گالری طلای پادیمو" },
  });
  await prisma.setting.upsert({
    where: { key: "default_shipping_cost" },
    update: {},
    create: { key: "default_shipping_cost", value: "0" },
  });
  await prisma.goldPrice.create({ data: { price: GOLD_PRICE } });

  console.log("→ Seeding admin & customer ...");
  await prisma.user.upsert({
    where: { phone: "09120000000" },
    update: { role: "ADMIN", secret: "admin123" },
    create: { phone: "09120000000", secret: "admin123", role: "ADMIN", firstName: "مدیر", lastName: "سایت" },
  });
  await prisma.user.upsert({
    where: { phone: "09120000001" },
    update: {},
    create: { phone: "09120000001", secret: "OTP_LOGIN", role: "USER", firstName: "علی", lastName: "رضایی" },
  });

  console.log("→ Seeding occasions ...");
  const occasionData = [
    ["ولنتاین", "valentine"],
    ["روز مادر", "mother-day"],
    ["روز زن", "woman-day"],
    ["نوروز", "nowruz"],
    ["یلدا", "yalda"],
  ];
  const occasions = {};
  for (const [title, slug] of occasionData) {
    occasions[slug] = await prisma.occasion.upsert({
      where: { slug },
      update: {},
      create: { title, slug },
    });
  }

  console.log("→ Seeding categories ...");
  const genders = [
    ["زنانه", "women", "FEMALE"],
    ["مردانه", "men", "MALE"],
    ["کودکان", "kids", "KIDS"],
  ];
  const types = [
    ["انگشتر", "ring"],
    ["گردنبند", "necklace"],
    ["گوشواره", "earring"],
    ["دستبند", "bracelet"],
    ["سرویس", "set"],
    ["نیم ست", "half-set"],
    ["پلاک", "plate"],
    ["مناسبتی", "occasional"],
  ];
  const categoryMap = {};
  let order = 0;
  for (const [gTitle, gSlug, gender] of genders) {
    const parent = await prisma.category.upsert({
      where: { slug: gSlug },
      update: {},
      create: { title: gTitle, slug: gSlug, gender, order: order++ },
    });
    for (const [tTitle, tSlug] of types) {
      const slug = `${gSlug}-${tSlug}`;
      categoryMap[slug] = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { title: `${tTitle} ${gTitle}`, slug, parentId: parent.id, gender },
      });
    }
  }

  console.log("→ Seeding tags ...");
  const tagData = [["جدید", "new"], ["لوکس", "luxury"], ["پرفروش", "bestseller"]];
  const tags = {};
  for (const [title, slug] of tagData) {
    tags[slug] = await prisma.tag.upsert({ where: { slug }, update: {}, create: { title, slug } });
  }

  console.log("→ Seeding products ...");
  const products = [
    { title: "انگشتر طلا زنانه طرح قلب", cat: "women-ring", weight: 3.2, occ: "valentine", featured: true },
    { title: "گردنبند طلا زنانه ظریف", cat: "women-necklace", weight: 2.1, occ: "mother-day", isNew: true },
    { title: "گوشواره طلا زنانه آویز", cat: "women-earring", weight: 1.8 },
    { title: "دستبند طلا زنانه النگویی", cat: "women-bracelet", weight: 6.5, featured: true },
    { title: "سرویس طلا کامل زنانه", cat: "women-set", weight: 18.0 },
    { title: "انگشتر طلا مردانه کلاسیک", cat: "men-ring", weight: 5.4 },
    { title: "زنجیر طلا مردانه", cat: "men-necklace", weight: 8.2, isNew: true },
    { title: "پلاک طلا اسم", cat: "women-plate", weight: 1.2, occ: "nowruz" },
    { title: "نیم ست طلا زنانه", cat: "women-half-set", weight: 4.7 },
    { title: "دستبند طلا کودک", cat: "kids-bracelet", weight: 0.9 },
  ];
  let i = 1;
  for (const p of products) {
    const code = `PD-${String(1000 + i)}`;
    const slug = `product-${i}`;
    const wage = 7 + (i % 3) * 4; // 7,11,15
    const profit = 5;
    const tax = 9;
    const priceCache = computeTotal({ weight: p.weight, wage, profit, tax });
    const exists = await prisma.product.findUnique({ where: { code } });
    if (!exists) {
      await prisma.product.create({
        data: {
          code,
          slug,
          title: p.title,
          gender: categoryMap[p.cat]?.gender || "UNISEX",
          weight: p.weight,
          karat: 18,
          wage,
          profit,
          tax,
          stock: 5 + i,
          priceCache,
          status: "AVAILABLE",
          isNewCollection: !!p.isNew,
          isFeatured: !!p.featured,
          images: [],
          description: `${p.title} با کیفیت عالی و ضمانت اصالت.`,
          metaTitle: p.title,
          categories: { connect: [{ id: categoryMap[p.cat].id }] },
          tags: { connect: [{ id: tags.new.id }] },
          occasions: p.occ ? { connect: [{ id: occasions[p.occ].id }] } : undefined,
        },
      });
    }
    i++;
  }

  console.log("→ Seeding gift bags ...");
  const bags = [
    ["بگ معمولی", "NORMAL", 150000n],
    ["بگ چوبی", "WOODEN", 450000n],
    ["بگ VIP", "VIP", 950000n],
    ["بگ مناسبتی", "OCCASION", 600000n],
  ];
  for (const [title, type, price] of bags) {
    const existing = await prisma.giftBag.findFirst({ where: { title } });
    if (!existing) {
      await prisma.giftBag.create({ data: { title, type, price, stock: 50, isActive: true } });
    }
  }

  console.log("→ Seeding delivery slots ...");
  for (let d = 1; d <= 5; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(0, 0, 0, 0);
    const existing = await prisma.deliverySlot.findFirst({
      where: { date, fromHour: "10:00" },
    });
    if (!existing) {
      await prisma.deliverySlot.create({
        data: { date, fromHour: "10:00", toHour: "14:00", capacity: 10 },
      });
      await prisma.deliverySlot.create({
        data: { date, fromHour: "16:00", toHour: "20:00", capacity: 10 },
      });
    }
  }

  console.log("→ Seeding CMS (banners, faq, badges, pages) ...");
  if ((await prisma.banner.count()) === 0) {
    await prisma.banner.createMany({
      data: [
        { title: "اسلاید اول", image: "/uploads/banners/slide1.jpg", position: "HOME_SLIDER", order: 1 },
        { title: "تخفیف ویژه", image: "/uploads/banners/ad1.jpg", position: "AD_BANNER", order: 1 },
      ],
    });
  }
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: [
        { question: "آیا طلاها دارای ضمانت اصالت هستند؟", answer: "بله، تمامی محصولات دارای ضمانت اصالت می‌باشند.", order: 1 },
        { question: "هزینه ارسال چقدر است؟", answer: "ارسال با پیک فروشگاه رایگان است.", order: 2 },
      ],
    });
  }
  if ((await prisma.trustBadge.count()) === 0) {
    await prisma.trustBadge.createMany({
      data: [
        { title: "نماد اعتماد الکترونیکی", image: "/uploads/badges/enamad.png", order: 1 },
        { title: "ضمانت اصالت", image: "/uploads/badges/guarantee.png", order: 2 },
      ],
    });
  }
  const pages = [
    ["about", "درباره ما", "گالری طلای پادیمو ..."],
    ["contact", "تماس با ما", "راه‌های ارتباطی ..."],
    ["terms", "قوانین و مقررات", "قوانین استفاده ..."],
    ["privacy", "حریم خصوصی", "سیاست حفظ حریم خصوصی ..."],
  ];
  for (const [slug, title, content] of pages) {
    await prisma.staticPage.upsert({
      where: { slug },
      update: {},
      create: { slug, title, content },
    });
  }

  console.log("→ Seeding discount code ...");
  await prisma.discountCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", type: "PERCENT", value: 10, maxDiscount: 5000000n, minOrder: 0n, target: "ALL", perUserLimit: 1, isActive: true },
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
