import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  Platform, 
  StatusBar as RNStatusBar 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import ReportScreen from './src/components/ReportScreen';
import HistoryScreen from './src/components/HistoryScreen';
import NearbyScreen from './src/components/NearbyScreen';
import AboutScreen from './src/components/AboutScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('report');
  const [headerLocation, setHeaderLocation] = useState('Delhi, IN');

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        let location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        let geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode && geocode.length > 0) {
          const address = geocode[0];
          const city = address.city || address.locality || address.subregion || 'Delhi';
          const region = address.region || address.state || 'IN';
          
          // Convert state name to regional code
          let stateAbbr = 'IN';
          const cleanRegion = region.toLowerCase();
          if (cleanRegion.includes('delhi')) stateAbbr = 'DL';
          else if (cleanRegion.includes('haryana')) stateAbbr = 'HR';
          else if (cleanRegion.includes('uttar pradesh')) stateAbbr = 'UP';
          else if (region.length >= 2) stateAbbr = region.substring(0, 2).toUpperCase();

          setHeaderLocation(`${city}, ${stateAbbr}`);
        }
      } catch (error) {
        console.log("Error fetching location for App header:", error);
      }
    })();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'report':
        return <ReportScreen onNavigateToHistory={() => setActiveTab('history')} />;
      case 'history':
        return <HistoryScreen activeTab={activeTab} onNavigateToReport={() => setActiveTab('report')} />;
      case 'nearby':
        return <NearbyScreen />;
      case 'about':
        return <AboutScreen />;
      default:
        return <ReportScreen onNavigateToHistory={() => setActiveTab('history')} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#0b0f19" />
      
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="eye" size={20} color="#a855f7" />
          </View>
          <Text style={styles.headerTitle}>InfraWatch</Text>
        </View>
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={12} color="#a855f7" style={{ marginRight: 4 }} />
          <Text style={styles.locationBadgeText}>{headerLocation}</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Custom Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('report')}
        >
          <Ionicons 
            name={activeTab === 'report' ? 'camera' : 'camera-outline'} 
            size={22} 
            color={activeTab === 'report' ? '#a855f7' : '#94a3b8'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'report' && styles.tabLabelActive]}>
            Report
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name={activeTab === 'history' ? 'time' : 'time-outline'} 
            size={22} 
            color={activeTab === 'history' ? '#a855f7' : '#94a3b8'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('nearby')}
        >
          <Ionicons 
            name={activeTab === 'nearby' ? 'compass' : 'compass-outline'} 
            size={22} 
            color={activeTab === 'nearby' ? '#a855f7' : '#94a3b8'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'nearby' && styles.tabLabelActive]}>
            Nearby
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('about')}
        >
          <Ionicons 
            name={activeTab === 'about' ? 'information-circle' : 'information-circle-outline'} 
            size={22} 
            color={activeTab === 'about' ? '#a855f7' : '#94a3b8'} 
          />
          <Text style={[styles.tabLabel, activeTab === 'about' && styles.tabLabelActive]}>
            About
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b0f19',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0b0f19',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a855f71a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#a855f730',
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a855f7',
  },
  content: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  tabBar: {
    height: 64,
    flexDirection: 'row',
    backgroundColor: '#0b0f19',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#a855f7',
    fontWeight: '700',
  },
});
