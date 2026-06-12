import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const firstNames = ["Priya","Ananya","Riya","Sneha","Pooja","Meera","Kavya","Divya","Nisha","Aisha","Zara","Sara","Aarti","Simran","Neha","Tanya","Kritika","Ishita","Shreya","Pallavi","Rohit","Arjun","Vikram","Rahul","Amit","Sanjay","Kiran","Suresh","Rajesh","Deepak","Lakshmi","Sunita","Geeta","Rekha","Anjali","Vishal","Manish","Nikhil","Aditya","Varun"];
const lastNames = ["Sharma","Patel","Singh","Reddy","Nair","Joshi","Mehta","Kumar","Gupta","Shah","Rao","Iyer","Verma","Mishra","Agarwal","Bose","Das","Chopra","Malhotra","Pillai"];
const cities = ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Pune","Kolkata","Ahmedabad","Jaipur","Surat"];
const products = [
  { name: "Vitamin C Serum 30ml",     category: "serum"       },
  { name: "Hydrating Moisturizer",    category: "moisturizer" },
  { name: "SPF 50 Sunscreen",         category: "sunscreen"   },
  { name: "Retinol Night Cream",      category: "night-cream" },
  { name: "Niacinamide Toner",        category: "toner"       },
  { name: "Hyaluronic Acid Serum",    category: "serum"       },
  { name: "Purifying Clay Mask",      category: "mask"        },
  { name: "Rose Hip Face Oil",        category: "oil"         },
  { name: "Brightening Eye Cream",    category: "eye-care"    },
  { name: "SPF Lip Balm",             category: "lip-care"    },
];

const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

async function main() {
  console.log("Clearing old data...");
  await prisma.messageEvent.deleteMany();
  await prisma.campaignMessage.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  console.log("Seeding 1000 customers...");
  for (let i = 0; i < 1000; i++) {
    const firstName = rand(firstNames);
    const lastName  = rand(lastNames);
    const name      = `${firstName} ${lastName}`;
    const email     = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`;

    // Mix of recent and older customers
    const joinedDaysAgo = i % 4 === 0 ? randInt(1, 30)      // 25% joined recently
                        : i % 4 === 1 ? randInt(31, 90)     // 25% joined 1-3 months ago
                        : i % 4 === 2 ? randInt(91, 180)    // 25% joined 3-6 months ago
                        :               randInt(181, 365);  // 25% joined 6-12 months ago

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone:     `+91${randInt(7000000000, 9999999999)}`,
        city:      rand(cities),
        createdAt: daysAgo(joinedDaysAgo),
      }
    });

    const orderCount = randInt(1, 6);
    for (let j = 0; j < orderCount; j++) {
      const product = rand(products);
      // Order dates: mix of very recent, recent, and older
      const orderDaysAgo = j === 0 ? randInt(1, 60)    // most recent order within 60 days
                         :           randInt(1, 180);  // others spread out
      await prisma.order.create({
        data: {
          customerId:  customer.id,
          productName: product.name,
          category:    product.category,
          amount:      randInt(299, 2999),
          orderedAt:   daysAgo(orderDaysAgo),
        }
      });
    }

    if (i % 100 === 0) console.log(`  ${i}/1000 done...`);
  }
  console.log("✅ Done! 1000 customers seeded.");
}

main().catch(console.error).finally(() => prisma.$disconnect());