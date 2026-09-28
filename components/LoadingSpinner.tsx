/**
 * components/LoadingSpinner.tsx
 * =============================
 * Composant spinner de chargement
 */

import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { COLORS } from '../constants/colors';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

/**
 * LoadingSpinner - Affiche un spinner + message optionnel
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={COLORS.primary}
        style={styles.spinner}
      />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.tertiary,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
});

export default LoadingSpinner;
