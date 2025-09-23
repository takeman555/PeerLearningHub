import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { testSupabaseConnection, getSupabaseInfo } from '../utils/supabaseTest';

export const SupabaseConnectionTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testSupabaseConnection();
      const message = result.success ? 
        `✅ ${result.message}` : 
        `❌ ${result.message}`;
      
      setLastResult(message);
      Alert.alert(
        result.success ? 'Connection Success' : 'Connection Failed',
        result.message
      );
    } catch (error) {
      const errorMessage = `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setLastResult(errorMessage);
      Alert.alert('Test Failed', errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const info = getSupabaseInfo();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Project URL:</Text>
        <Text style={[styles.infoValue, info.hasValidUrl ? styles.valid : styles.invalid]}>
          {info.url}
        </Text>
        
        <Text style={styles.infoLabel}>API Key:</Text>
        <Text style={[styles.infoValue, info.hasValidKey ? styles.valid : styles.invalid]}>
          {info.hasValidKey ? 'Configured ✓' : 'Not configured ✗'}
        </Text>
        
        <Text style={styles.infoLabel}>Status:</Text>
        <Text style={[styles.infoValue, info.isConfigured ? styles.valid : styles.invalid]}>
          {info.isConfigured ? 'Ready to test' : 'Configuration needed'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, (!info.isConfigured || testing) && styles.buttonDisabled]}
        onPress={handleTest}
        disabled={!info.isConfigured || testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>

      {lastResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{lastResult}</Text>
        </View>
      ) : null}

      {!info.isConfigured && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Please configure your Supabase credentials in the .env file
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoContainer: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    color: '#333',
  },
  infoValue: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  valid: {
    color: '#22c55e',
  },
  invalid: {
    color: '#ef4444',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  warningContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
  },
});