import { getUncachableStripeClient } from "./stripeClient";

async function createProducts() {
  console.log("Creating StreakProof Pro subscription product...");
  
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.search({
    query: "name:'StreakProof Pro'",
  });

  if (existingProducts.data.length > 0) {
    console.log("StreakProof Pro product already exists:", existingProducts.data[0].id);
    return;
  }

  const product = await stripe.products.create({
    name: "StreakProof Pro",
    description: "Premium habit tracking with unlimited commitments, advanced analytics, Dopamine Lab, and Stoic Room access.",
    metadata: {
      tier: "pro",
      features: "unlimited_commitments,advanced_analytics,dopamine_lab,stoic_room,priority_support",
    },
  });

  console.log("Created product:", product.id);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 999,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: {
      billing_period: "monthly",
    },
  });

  console.log("Created monthly price:", monthlyPrice.id, "- $9.99/month");

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 7999,
    currency: "usd",
    recurring: { interval: "year" },
    metadata: {
      billing_period: "yearly",
      savings: "33%",
    },
  });

  console.log("Created yearly price:", yearlyPrice.id, "- $79.99/year");

  console.log("\nProducts created successfully!");
  console.log("Monthly Price ID:", monthlyPrice.id);
  console.log("Yearly Price ID:", yearlyPrice.id);
}

createProducts()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error creating products:", error);
    process.exit(1);
  });
