import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSearch: (productName: string) => void;
  initialValue?: string;
}

export const ManualSearchModal: React.FC<Props> = ({
  visible,
  onClose,
  onSearch,
  initialValue = ''
}) => {
  const [productName, setProductName] = useState(initialValue);

  const handleSearch = () => {
    if (productName.trim().length >= 2) {
      onSearch(productName.trim());
      setProductName('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Manual Product Search</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Couldn't find the product? Enter the product name manually to search
            for prices.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter product name (e.g., iPhone 14 Pro)"
            value={productName}
            onChangeText={setProductName}
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for better results:</Text>
            <Text style={styles.tip}>• Include brand name</Text>
            <Text style={styles.tip}>• Add model number if available</Text>
            <Text style={styles.tip}>• Mention storage/size for electronics</Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.searchButton,
                productName.trim().length < 2 && styles.searchButtonDisabled
              ]}
              onPress={handleSearch}
              disabled={productName.trim().length < 2}
            >
              <Text style={styles.searchButtonText}>Search Prices</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 16,
    color: '#64748b'
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  tips: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8
  },
  tip: {
    fontSize: 12,
    color: '#0c4a6e',
    marginBottom: 4
  },
  buttons: {
    flexDirection: 'row',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b'
  },
  searchButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1a73e8',
    alignItems: 'center'
  },
  searchButtonDisabled: {
    backgroundColor: '#94a3b8'
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  }
});
