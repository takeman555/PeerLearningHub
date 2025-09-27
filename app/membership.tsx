import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AuthGuard from '../components/AuthGuard';
import MembershipScreen from '../components/Membership/MembershipScreen';

export default function MembershipPage() {
  const router = useRouter();

  return (
    <AuthGuard requireAuth={true}>
      <SafeAreaView style={styles.safeArea}>
        <MembershipScreen />
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});