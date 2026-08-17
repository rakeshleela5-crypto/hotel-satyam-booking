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
      bedType: "Queen / Twin Beds",
      occupancy: { adults: 2, children: 1, text: "2 Adults, 1 Child" },
      cancellationPolicy: "Free cancellation up to 24 hrs before check-in",
      description: "Comfortable, beautifully furnished room for two with plush bedding, climate control, and essential modern comforts.",
      photos: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
        "/satyam-residency-facade.jpg"
      ],
      amenities: ["Free Wi-Fi", "AC", "TV", "Geyser/Hot Water", "Room Service"],
      keyAmenities: [
        { icon: "📶", label: "Free Wi-Fi" },
        { icon: "❄️", label: "AC" },
        { icon: "🚿", label: "Geyser / Hot Water" },
        { icon: "🛎️", label: "Room Service" },
        { icon: "📺", label: "HD TV" }
      ]
    },
    {
      id: "deluxe",
      name: "Deluxe Room",
      price: 2499,
      bedType: "King / Queen Plush Bed",
      occupancy: { adults: 2, children: 1, text: "2 Adults, 1 Child" },
      cancellationPolicy: "Free cancellation up to 24 hrs before check-in",
      description: "Spacious luxury room with city views, ambient mood lighting, upgraded furnishings, and 24/7 dedicated room service.",
      photos: [
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
      ],
      amenities: ["Free Wi-Fi", "AC", "Smart TV", "Mini Fridge", "24/7 Room Service", "Geyser/Hot Water"],
      keyAmenities: [
        { icon: "📶", label: "High-Speed Wi-Fi" },
        { icon: "❄️", label: "Climate Control AC" },
        { icon: "🚿", label: "Geyser / 24/7 Hot Water" },
        { icon: "🛎️", label: "24/7 Room Service" },
        { icon: "📺", label: "Smart TV" },
        { icon: "🧊", label: "Mini Fridge" }
      ]
    },
    {
      id: "suite",
      name: "Executive Suite",
      price: 4999,
      bedType: "Grand King Size Bed",
      occupancy: { adults: 3, children: 1, text: "3 Adults, 1 Child" },
      cancellationPolicy: "Free cancellation up to 24 hrs before check-in",
      description: "Our signature luxury suite featuring a separate living lounge, private workspace, bathtub, complimentary breakfast, and VIP lounge access.",
      photos: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80"
      ],
      amenities: ["Free Wi-Fi", "AC", "Smart TV", "Mini Fridge", "Bathtub", "Lounge Access", "Breakfast Included", "24/7 Room Service", "Geyser/Hot Water"],
      keyAmenities: [
        { icon: "📶", label: "Ultra High-Speed Wi-Fi" },
        { icon: "❄️", label: "Dual AC" },
        { icon: "🚿", label: "Geyser & Bathtub" },
        { icon: "🛎️", label: "24/7 Butler Service" },
        { icon: "📺", label: "55\" Smart TV" },
        { icon: "🍳", label: "Breakfast Included" },
        { icon: "🛋️", label: "Private Living Lounge" }
      ]
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
