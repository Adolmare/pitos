export const CATEGORIES = [
  { id: 'all', name: 'Todo el Menú' },
  { id: 'pizzas', name: 'Pizzas' },
  { id: 'rapidas', name: 'Comidas Rápidas' },
  { id: 'bebidas', name: 'Cócteles y Bebidas' },
  { id: 'helados', name: 'Helados y Postres' },
];

export const MENU_ITEMS = [
  // Pizzas
  { id: 1, name: 'Pizza Hawaiana', category: 'pizzas', price: 30000, description: 'Jamón, piña, queso mozzarella.', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=60' },
  { id: 2, name: 'Pizza Mexicana', category: 'pizzas', price: 29000, description: 'Tocineta, cebolla, tomate, maíz, jalapeños.', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=60' },
  
  // Comidas Rápidas
  { id: 3, name: 'Perro de la Casa', category: 'rapidas', price: 18000, description: 'Butifarra, pollo, chorizo, suizo, mozzarella, maíz.', image: 'https://images.unsplash.com/photo-1619250907693-518293673c09?auto=format&fit=crop&w=500&q=60' },
  { id: 4, name: 'Salchipapa Super', category: 'rapidas', price: 20000, description: 'Butifarra, chorizo, salchicha, gratinada.', image: 'https://images.unsplash.com/photo-1585325701165-351af916e581?auto=format&fit=crop&w=500&q=60' },
  { id: 5, name: 'Hamburguesa Monster', category: 'rapidas', price: 43000, description: '3 carnes, pollo, cerdo, maduritos, gratinada.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60' },

  // Bebidas
  { id: 6, name: 'Margarita de Coco', category: 'bebidas', price: 16000, description: 'Tequila, limón, zumo de coco.', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=60' },
  { id: 7, name: 'Granizado de Café', category: 'bebidas', price: 10000, description: 'Refrescante granizado con el mejor café.', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=500&q=60' },

  // Helados
  { id: 8, name: 'Copa Oreo', category: 'helados', price: 15000, description: 'Helado de vainilla, brownie, salsa de chocolate, oreo.', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=500&q=60' },
  { id: 9, name: 'Banana Split', category: 'helados', price: 18000, description: '3 bolas de helado, chantilly, barquillos, fruta fresca.', image: 'https://images.unsplash.com/photo-1560963689-02e8201481e7?auto=format&fit=crop&w=500&q=60' },
];
