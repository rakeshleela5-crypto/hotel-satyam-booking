export const config = {
  hotel: {
    name: "Satyam Residency",
    tagline: "Experience the Pinnacle of Refined Comfort.",
    ownerName: "GAURI PRASAD",
    phone: "+91 98765 43210",
    email: "contact@satyamresidency.com",
    address: "Main Road, Near Railway Station",
  },
  roomTypes: [
    {
      id: "standard",
      name: "Standard Room",
      price: 1499,
      description: "Comfortable room for two with basic amenities.",
      amenities: ["Free Wi-Fi", "AC", "TV"]
    },
    {
      id: "deluxe",
      name: "Deluxe Room",
      price: 2499,
      description: "Spacious room with a city view and premium bedding.",
      amenities: ["Free Wi-Fi", "AC", "TV", "Mini Fridge"]
    },
    {
      id: "suite",
      name: "Executive Suite",
      price: 4999,
      description: "Luxury suite with a separate living area and premium services.",
      amenities: ["Free Wi-Fi", "AC", "Smart TV", "Mini Fridge", "Bathtub", "Room Service"]
    }
  ],
  testimonial: {
    text: "An absolutely luxurious experience. The mood, the service, and the attention to detail at Satyam Residency are unmatched.",
    author: "— A. Sharma"
  }
};
