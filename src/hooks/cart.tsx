import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const existingStorage = await AsyncStorage.getItem(
        '@GoMarketplace: products',
      );

      existingStorage && setProducts(JSON.parse(existingStorage));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const existingProduct = products.find(item => item.id === product.id);

      if (existingProduct) {
        const modifiedProduct: Product = {
          ...existingProduct,
          quantity: existingProduct.quantity + 1,
        };

        const modifiedList = products.filter(
          item => item.id !== modifiedProduct.id,
        );

        AsyncStorage.setItem(
          '@GoMarketplace: products',
          JSON.stringify([...modifiedList, modifiedProduct]),
        );

        setProducts([...modifiedList, modifiedProduct]);
        return;
      }

      const newProduct: Product = {
        ...product,
        quantity: 1,
      };

      const newList = [...products, newProduct];

      AsyncStorage.setItem('@GoMarketplace: products', JSON.stringify(newList));

      setProducts(newList);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const idProduct = products.find(item => id === item.id);

      idProduct && addToCart(idProduct);
    },
    [products, addToCart],
  );

  const decrement = useCallback(
    async id => {
      const idProduct = products.find(item => id === item.id);

      if (idProduct) {
        if (idProduct.quantity === 0) {
          return;
        }

        const modifiedProduct: Product = {
          ...idProduct,
          quantity: idProduct.quantity - 1,
        };

        const modifiedList = products.filter(
          item => item.id !== modifiedProduct.id,
        );

        AsyncStorage.setItem(
          '@GoMarketplace: products',
          JSON.stringify([...modifiedList, modifiedProduct]),
        );
        setProducts([...modifiedList, modifiedProduct]);
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
