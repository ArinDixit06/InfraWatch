import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function NearbyScreen() {
  const [activeCityTab, setActiveCityTab] = useState('delhi'); // 'delhi' | 'gurugram' | 'noida' | 'national'
  const [detectedAddress, setDetectedAddress] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Auto-detect user city on load
  useEffect(() => {
    detectUserCity();
  }, []);

  const detectUserCity = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode && geocode.length > 0) {
        const address = geocode[0];
        const city = (address.city || address.locality || address.subregion || '').toLowerCase();
        const region = (address.region || address.state || '').toLowerCase();
        const areaName = address.name || address.street || '';
        
        setDetectedAddress(`${areaName ? areaName + ', ' : ''}${address.city || address.locality || ''}`);

        if (city.includes('gurugram') || city.includes('gurgaon') || region.includes('haryana')) {
          setActiveCityTab('gurugram');
        } else if (city.includes('noida') || city.includes('greater noida') || region.includes('uttar pradesh')) {
          setActiveCityTab('noida');
        } else if (city.includes('delhi') || city.includes('new delhi')) {
          setActiveCityTab('delhi');
        }
      }
    } catch (e) {
      console.error("Location detection failed on Nearby screen:", e);
    } finally {
      setIsLocating(false);
    }
  };

  const helplineData = {
    delhi: {
      title: "Delhi Governance (MCD & PWD)",
      desc: "Contact information for Delhi's civic divisions (Municipal Corporation, Public Works, and Local Services).",
      contacts: [
        {
          name: "MCD Toll-Free",
          fullName: "Municipal Corporation of Delhi",
          helpline: "155305",
          twitter: "@MCD_Delhi",
          desc: "Residential sector roads, local sanitation, parks, street lights, and pedestrian footbridges."
        },
        {
          name: "PWD Delhi Central",
          fullName: "Delhi Public Works Department",
          helpline: "1908",
          twitter: "@PWD_Delhi",
          desc: "Toll-free pothole reporting for major city roads (width > 60ft), flyovers, subways, and bridges."
        },
        {
          name: "MCD Central Helpline",
          fullName: "Civic Complaints Registry",
          helpline: "1800110093",
          twitter: "@MCD_Delhi",
          desc: "Direct registration of potholes, road cracking, and garbage dumping with ticket tracking."
        },
        {
          name: "Delhi Traffic Police",
          fullName: "Traffic Management & Hazards Unit",
          helpline: "1095",
          twitter: "@dtptraffic",
          desc: "Report major road caves, severe waterlogging causing gridlock, or structural hazards on roads."
        }
      ]
    },
    gurugram: {
      title: "Gurugram Governance (MCG & GMDA)",
      desc: "Helplines for Gurugram (Gurgaon) civic bodies maintained by Haryana municipal agencies.",
      contacts: [
        {
          name: "MCG Toll-Free",
          fullName: "Municipal Corporation of Gurugram",
          helpline: "18001801817",
          twitter: "@MunCorpGurugram",
          desc: "Colony streets, sector inner roads, lighting, local drainage repairs, and public pathways."
        },
        {
          name: "GMDA Call Center",
          fullName: "Gurugram Metropolitan Development Authority",
          helpline: "0124-2746600",
          twitter: "@officialgmda",
          desc: "Major arterial sector roads (multi-lane dividers), major city flyovers, storm water drains."
        },
        {
          name: "Gurugram Traffic Police",
          fullName: "Road Safety Helpline",
          helpline: "0124-2386000",
          twitter: "@GurugramTraffic",
          desc: "Log issues regarding dysfunctional traffic lights, deep road damage blocking highway entry points."
        },
        {
          name: "Haryana CM Window",
          fullName: "Grievance Redressal Portal",
          helpline: "18002000022",
          twitter: "@cmofharyana",
          desc: "Higher authority registration for unresolved local sector repairs or delayed civil works."
        }
      ]
    },
    noida: {
      title: "Noida Governance (Noida Auth & UP)",
      desc: "Helplines for Noida, Greater Noida, and Gautam Buddha Nagar under Uttar Pradesh state authorities.",
      contacts: [
        {
          name: "Noida Authority",
          fullName: "Noida Industrial Development Authority",
          helpline: "0120-2425025",
          twitter: "@noida_authority",
          desc: "Sector inner roads, residential pathways, local drainage, park maintenance, and lighting."
        },
        {
          name: "Noida Traffic Helpdesk",
          fullName: "Traffic Police Division",
          helpline: "9971009001",
          twitter: "@noidatraffic",
          desc: "WhatsApp support line to report road caving, structural bridge issues, or accidents due to defects."
        },
        {
          name: "UP Jansunwai",
          fullName: "Integrated Grievance Redressal System",
          helpline: "1076",
          twitter: "@UPGovt",
          desc: "Direct registration of pending municipal complaints to the Uttar Pradesh Chief Minister portal."
        }
      ]
    },
    national: {
      title: "National & Expressway Helplines",
      desc: "Emergency infrastructure contacts for national highways, expressways, and rescue services.",
      contacts: [
        {
          name: "NHAI Highways",
          fullName: "National Highways Authority of India",
          helpline: "1033",
          twitter: "@NHAI_Official",
          desc: "Delhi-Gurugram Expressway, NH-48, DND, national expressways, toll road structures, and highway potholes."
        },
        {
          name: "MoRTH Helpline",
          fullName: "Ministry of Road Transport and Highways",
          helpline: "1800116555",
          twitter: "@morthindia",
          desc: "Grievance reporting for interstate transport infrastructure and national highway quality."
        },
        {
          name: "National Emergency",
          fullName: "Unified Emergency Dispatch",
          helpline: "112",
          twitter: "@112_India",
          desc: "Call for immediate police, fire, or ambulance services in the event of accidents or bridge collapses."
        }
      ]
    }
  };

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`).catch(err => {
      console.error("Failed to open dialer:", err);
      alert(`Cannot make calls on this device. Helpline: ${number}`);
    });
  };

  const handleTwitter = (handle) => {
    const cleanHandle = handle.replace('@', '');
    const url = Platform.OS === 'web' 
      ? `https://twitter.com/${cleanHandle}`
      : `twitter://user?screen_name=${cleanHandle}`;
      
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://twitter.com/${cleanHandle}`);
    });
  };

  const activeCityData = helplineData[activeCityTab];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Nearby & Helplines</Text>
      <Text style={styles.subtitle}>
        Quick access to localized helpline numbers, civic bodies, and official contact channels.
      </Text>

      {/* Geolocation Info Banner */}
      <View style={styles.locationBanner}>
        <View style={styles.bannerLeft}>
          <Ionicons name="compass" size={20} color="#a855f7" />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerLabel}>Detected City</Text>
            <Text style={styles.bannerValue}>
              {isLocating ? "Detecting location..." : detectedAddress || "Delhi-NCR, India"}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.refreshLocBtn}
          onPress={detectUserCity}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="refresh" size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      {/* City Switcher Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabItem, activeCityTab === 'delhi' && styles.tabItemActive]}
          onPress={() => setActiveCityTab('delhi')}
        >
          <Text style={[styles.tabLabel, activeCityTab === 'delhi' && styles.tabLabelActive]}>Delhi</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeCityTab === 'gurugram' && styles.tabItemActive]}
          onPress={() => setActiveCityTab('gurugram')}
        >
          <Text style={[styles.tabLabel, activeCityTab === 'gurugram' && styles.tabLabelActive]}>Gurugram</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeCityTab === 'noida' && styles.tabItemActive]}
          onPress={() => setActiveCityTab('noida')}
        >
          <Text style={[styles.tabLabel, activeCityTab === 'noida' && styles.tabLabelActive]}>Noida</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeCityTab === 'national' && styles.tabItemActive]}
          onPress={() => setActiveCityTab('national')}
        >
          <Text style={[styles.tabLabel, activeCityTab === 'national' && styles.tabLabelActive]}>National</Text>
        </TouchableOpacity>
      </View>

      {/* Main Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoCardHeader}>
          <Ionicons name="information-circle-outline" size={20} color="#a855f7" style={{ marginRight: 6 }} />
          <Text style={styles.infoCardTitle}>{activeCityData.title}</Text>
        </View>
        <Text style={styles.infoCardText}>{activeCityData.desc}</Text>
      </View>

      {/* Helplines List */}
      <View style={styles.listSection}>
        {activeCityData.contacts.map((contact, index) => (
          <View key={index} style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={styles.contactBrand}>
                <View style={styles.initialsCircle}>
                  <Text style={styles.initialsText}>{contact.name.substring(0, 3)}</Text>
                </View>
                <View style={styles.nameContainer}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactFullName}>{contact.fullName}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.descText}>{contact.desc}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.callBtn}
                onPress={() => handleCall(contact.helpline)}
              >
                <Ionicons name="call" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.btnText}>Call {contact.helpline}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.twitterBtn}
                onPress={() => handleTwitter(contact.twitter)}
              >
                <Ionicons name="logo-twitter" size={14} color="#a855f7" style={{ marginRight: 6 }} />
                <Text style={styles.twitterBtnText}>{contact.twitter}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Emergency tip */}
      <View style={styles.tipBox}>
        <Ionicons name="warning-outline" size={20} color="#fbbf24" style={{ marginRight: 10, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Active Road Hazard?</Text>
          <Text style={styles.tipText}>
            For structural collapses, exposed electrical lines on waterlogged roads, or accidents, please dial the National Emergency number 112 immediately.
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#0b0f19',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b50',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    marginBottom: 20,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerValue: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
    marginTop: 2,
  },
  refreshLocBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#a855f7',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  infoCard: {
    backgroundColor: '#1e293b40',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginBottom: 20,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  infoCardText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  listSection: {
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: '#1e293b20',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  initialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#a855f71a',
    borderWidth: 1,
    borderColor: '#a855f730',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '700',
  },
  nameContainer: {
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  contactFullName: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  descText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#a855f7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  twitterBtn: {
    flex: 1,
    backgroundColor: '#a855f710',
    borderWidth: 1,
    borderColor: '#a855f730',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  twitterBtnText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '700',
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#fbbf2410',
    borderWidth: 1,
    borderColor: '#fbbf2430',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
});
