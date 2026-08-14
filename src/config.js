export const config = {
  hotel: {
    name: "Satyam Residency",
    tagline: "Experience Luxury & Comfort in Rayagada",
    subtitle: "Your luxurious home away from home in the heart of Rayagada.",
    ownerName: "Satyam Management",
    owners: [
      { name: "Owner 1", phone: "+91 9437095490" },
      { name: "Owner 2", phone: "+91 8895860888" }
    ],
    receptionPhone: "+91 8984938388",
    phone: "+91 8984938388",
    email: "satyamresidency99@gmail.com",
    address: "Gajapati Junction, New Colony first line, Rayagada-765001, Odisha",
    aboutText: "Situated in the vibrant Gajapati Junction of Rayagada, Satyam Residency offers a perfect blend of modern luxury and traditional hospitality. Whether you are traveling for business or leisure, our premium accommodations and world-class amenities ensure a memorable stay. Experience unmatched comfort, dedicated service, and a serene environment right in the heart of the city."
  },
  // Photos Gallery: Featuring real hotel photos!
  gallery: [
    {
      id: "facade",
      title: "Satyam Residency Entrance",
      category: "Real Photo",
      url: "/satyam-residency-facade.jpg",
      caption: "Actual entrance and glowing signboard of Satyam Residency at Gajapati Junction, Rayagada."
    },
    {
      id: "deluxe",
      title: "Deluxe Bedroom",
      category: "Rooms",
      url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
      caption: "Spacious Deluxe Room featuring plush bedding and ambient lighting."
    },
    {
      id: "suite",
      title: "Executive Suite Living Area",
      category: "Suites",
      url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      caption: "Executive Suite with separate living lounge and high-speed Wi-Fi."
    },
    {
      id: "lobby",
      title: "Reception & Lounge",
      category: "Lobby",
      url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
      caption: "Warm 24/7 reception desk and guest welcoming lounge."
    }
  ],
  roomTypes: [
    {
      id: "standard",
      name: "Standard Room",
      price: 1499,
      description: "Comfortable room for two with premium bedding and basic amenities.",
      amenities: ["Free Wi-Fi", "AC", "TV", "Hot Water"]
    },
    {
      id: "deluxe",
      name: "Deluxe Room",
      price: 2499,
      description: "Spacious room with city view, extra seating area, and upgraded amenities.",
      amenities: ["Free Wi-Fi", "AC", "Smart TV", "Mini Fridge", "24/7 Room Service"]
    },
    {
      id: "suite",
      name: "Executive Suite",
      price: 4999,
      description: "Luxury suite with a separate living area, king-size bed, and premium services.",
      amenities: ["Free Wi-Fi", "AC", "Smart TV", "Mini Fridge", "Bathtub", "Lounge Access", "Breakfast Included"]
    }
  ],
  reviews: [
    {
      text: "Absolutely wonderful stay! The rooms were pristine, and the staff went above and beyond to make our trip to Rayagada special. Highly recommend!",
      author: "Rajesh K."
    },
    {
      text: "The location is fantastic, right at Gajapati Junction. Very convenient for business travelers. The WiFi is fast and reliable.",
      author: "Sneha M."
    },
    {
      text: "Beautiful interiors and a very comfortable bed. The booking process was seamless. Will definitely stay here again.",
      author: "Ankit D."
    }
  ],
  testimonial: {
    text: "An absolutely luxurious experience. The mood, the service, and the attention to detail at Satyam Residency are unmatched.",
    author: "— A. Sharma"
  }
};
