const { PrismaClient } = require("./node_modules/.prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    UPDATE "OrderItem"
    SET quantity = 1
    WHERE quantity IS NULL;
  `);

  console.log("✅ Fixed OrderItem quantity NULL -> set to 1");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
