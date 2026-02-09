import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AuthScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FloofMap</Text>
      <Text style={styles.subtitle}>Dog Walk Tracker</Text>
      <Text style={styles.info}>Authentication Screen - To be implemented</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FF6B6B',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#666',
  },
  info: {
    fontSize: 14,
    color: '#999',
  },
});

export default AuthScreen;
