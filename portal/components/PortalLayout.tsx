import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import PortalGuard from './PortalGuard';
import PortalNav from './PortalNav';

export default function PortalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PortalGuard>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <PortalNav />
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </PortalGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    gap: 16,
  },
});
