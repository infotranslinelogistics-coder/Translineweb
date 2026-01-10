import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const NAV_ITEMS = [
  { label: 'Dashboard', route: 'PortalDashboard' },
  { label: 'Shifts', route: 'PortalShifts' },
  { label: 'Vehicles', route: 'PortalVehicles' },
  { label: 'Events', route: 'PortalEvents' },
  { label: 'Admin Actions', route: 'PortalAdminActions' },
];

export default function PortalNav() {
  const navigation = useNavigation();

  return (
    <View style={styles.nav}>
      {NAV_ITEMS.map(item => (
        <TouchableOpacity
          key={item.route}
          style={styles.navButton}
          onPress={() => navigation.navigate(item.route as never)}
        >
          <Text style={styles.navButtonText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
