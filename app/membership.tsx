import React from 'react';
import { View, StyleSheet } from 'react-native';
import MembershipScreen from '../components/Membership/MembershipScreen';

export default function MembershipPage() {
  return (
    <View style={styles.container}>
      <MembershipScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});