import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Product } from '../types';

interface Props {
  product: Product;
  showBarcode?: boolean;
}

export const ProductCard: React.FC<Props> = ({
  product,
  showBarcode = true
}) => {
  return (
    <View style={styles.container}>
      {product.imageUrl ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>No Image</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        {product.brand && (
          <Text style={styles.brand}>{product.brand}</Text>
        )}

        {product.category && (
          <Text style={styles.category} numberOfLines={1}>
            {product.category}
          </Text>
        )}

        {showBarcode && product.barcode && (
          <Text style={styles.barcode}>UPC: {product.barcode}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#94a3b8'
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4
  },
  brand: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '500',
    marginBottom: 2
  },
  category: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4
  },
  barcode: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'monospace'
  }
});
