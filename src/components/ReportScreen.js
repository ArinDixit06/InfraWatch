import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  Modal, 
  Platform,
  Dimensions,
  TextInput,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { analyzeInfrastructureDamage } from '../utils/gemini';
import { shareReportCard } from '../utils/share';
import ReportCard from './ReportCard';

const { width } = Dimensions.get('window');

const INFRA_TYPES = [
  { id: 'Road/Pothole', label: 'Road / Pothole', icon: 'trail-sign-outline' },
  { id: 'Bridge/Overpass', label: 'Bridge / Overpass', icon: 'git-commit-outline' },
  { id: 'Footbridge', label: 'Footbridge', icon: 'walk-outline' },
  { id: 'Flyover/Ramp', label: 'Flyover / Ramp', icon: 'trending-up-outline' }
];

const ROAD_CLASSES = [
  { id: 'colony', label: 'Colony Road (MCD / Local)', desc: 'Residential streets maintained by local municipal bodies.' },
  { id: 'arterial', label: 'Main Arterial Road (PWD)', desc: 'Major city roads and corridors.' },
  { id: 'highway', label: 'Highway / Flyover (NHAI)', desc: 'National highways and main flyover networks.' },
  { id: 'bridge', label: 'Bridge (PWD/NHAI)', desc: 'River crossings and major overpass structures.' },
  { id: 'footbridge', label: 'Footbridge (Municipal)', desc: 'Pedestrian structures crossing roads or railways.' }
];

export default function ReportScreen({ onNavigateToHistory }) {
  const [imageUri, setImageUri] = useState(null);
  const [infraType, setInfraType] = useState('');
  const [roadClass, setRoadClass] = useState('colony');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Location states
  const [locationStr, setLocationStr] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [result, setResult] = useState(null);
  
  // Complaint Letter Modal state
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [letterLanguage, setLetterLanguage] = useState('english'); // 'english' | 'hindi'
  const [copiedText, setCopiedText] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  // Ref for ReportCard HTML screenshot
  const cardRef = useRef(null);

  // Try to automatically detect location on component mount
  useEffect(() => {
    autoDetectLocation();
  }, []);

  const autoDetectLocation = async () => {
    try {
      let { status } = await Location.getLastKnownPositionAsync({});
      // If we don't have last known, request permission silently
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.granted) {
        handleDetectLocation();
      } else {
        setLocationStr('Delhi, India'); // Default fallback
      }
    } catch (e) {
      setLocationStr('Delhi, India');
    }
  };

  // Trigger GPS location detection
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied. You can still enter your location manually.');
        setIsDetectingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get city / readable address
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const address = geocode[0];
        
        // Build address parts
        const area = address.name || address.street || address.district;
        const city = address.city || address.subregion || address.locality;
        const state = address.region || address.state;

        const parts = [area, city, state].filter(Boolean);
        const formattedAddress = parts.join(', ');
        setLocationStr(formattedAddress || `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
      } else {
        setLocationStr(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.error("Failed to detect location:", error);
      alert("Error detecting location. Please type it manually.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Trigger camera or gallery selection
  const handleSelectImage = async (useCamera = false) => {
    try {
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync() 
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert(`Camera permission is required to ${useCamera ? 'take a photo' : 'upload from gallery'}.`);
        return;
      }

      const pickerResult = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setImageUri(pickerResult.assets[0].uri);
        setErrorMsg(null);
        setResult(null); // Clear previous result to allow fresh analysis
      }
    } catch (err) {
      console.error("Image picking error:", err);
      setErrorMsg("Failed to load image. Please try again.");
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri || !infraType || !roadClass) return;

    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    const finalLocation = locationStr.trim() || 'Delhi, India';

    try {
      const analysisResult = await analyzeInfrastructureDamage(imageUri, infraType, roadClass, finalLocation);
      setResult(analysisResult);

      // Save to AsyncStorage history
      const historyStr = await AsyncStorage.getItem('infrawatch_history');
      let historyList = [];
      if (historyStr) {
        historyList = JSON.parse(historyStr);
      }
      
      // Prepend to history
      historyList.unshift(analysisResult);
      await AsyncStorage.setItem('infrawatch_history', JSON.stringify(historyList));

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during Gemini analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    await shareReportCard(cardRef, imageUri);
  };

  const handleCopyLetter = async () => {
    if (!result) return;
    const textToCopy = letterLanguage === 'english' 
      ? result.complaint_letter_english 
      : result.complaint_letter_hindi;
      
    await Clipboard.setStringAsync(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyEmail = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result.authority_email || '');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopySubject = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result.complaint_email_subject || '');
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  // Launch device mail client prefilled
  const handleOpenMailApp = async () => {
    if (!result) return;
    const recipient = result.authority_email || '';
    const subject = encodeURIComponent(result.complaint_email_subject || '');
    const bodyText = letterLanguage === 'english' 
      ? result.complaint_letter_english 
      : result.complaint_letter_hindi;
    const body = encodeURIComponent(bodyText || '');

    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;
    Linking.openURL(mailtoUrl).catch((err) => {
      console.error("Failed to open mail app:", err);
      alert("Could not open your mail application. You can copy the email fields manually.");
    });
  };

  const clearForm = () => {
    setImageUri(null);
    setInfraType('');
    setRoadClass('colony');
    setResult(null);
    setErrorMsg(null);
    autoDetectLocation(); // Re-detect location on clear
  };

  const selectedRoadClassObj = ROAD_CLASSES.find(rc => rc.id === roadClass);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>New Damage Report</Text>
      <Text style={styles.subtitle}>
        Document public infrastructure issues and automatically draft formal reports using Gemini Vision AI.
      </Text>

      {/* 1. Camera / Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>1. Visual Evidence</Text>
        
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={28} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadBoxContainer}>
            <TouchableOpacity 
              style={[styles.uploadBox, styles.uploadLeft]} 
              onPress={() => handleSelectImage(true)}
            >
              <View style={styles.uploadIconCircle}>
                <Ionicons name="camera" size={30} color="#a855f7" />
              </View>
              <Text style={styles.uploadBoxText}>Take Photo</Text>
              <Text style={styles.uploadSubtext}>Use Device Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.uploadBox, styles.uploadRight]} 
              onPress={() => handleSelectImage(false)}
            >
              <View style={styles.uploadIconCircle}>
                <Ionicons name="images" size={30} color="#6366f1" />
              </View>
              <Text style={styles.uploadBoxText}>Upload Image</Text>
              <Text style={styles.uploadSubtext}>From Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 2. Infrastructure Type */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>2. Infrastructure Type</Text>
        <View style={styles.typeGrid}>
          {INFRA_TYPES.map((type) => {
            const isSelected = infraType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  isSelected && styles.typeButtonSelected
                ]}
                onPress={() => setInfraType(type.id)}
              >
                <Ionicons 
                  name={type.icon} 
                  size={20} 
                  color={isSelected ? '#ffffff' : '#a855f7'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  isSelected && styles.typeButtonTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Road Classification Dropdown */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>3. Road Classification</Text>
        <TouchableOpacity 
          style={styles.dropdownSelector}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <View style={styles.dropdownValueContainer}>
            <Ionicons name="map-outline" size={18} color="#a855f7" style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.dropdownValueText}>
                {selectedRoadClassObj?.label}
              </Text>
              <Text style={styles.dropdownValueDesc} numberOfLines={1}>
                {selectedRoadClassObj?.desc}
              </Text>
            </View>
          </View>
          <Ionicons 
            name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
            size={18} 
            color="#94a3b8" 
          />
        </TouchableOpacity>

        {isDropdownOpen && (
          <View style={styles.dropdownList}>
            {ROAD_CLASSES.map((rc) => {
              const isSelected = roadClass === rc.id;
              return (
                <TouchableOpacity
                  key={rc.id}
                  style={[
                    styles.dropdownItem,
                    isSelected && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    setRoadClass(rc.id);
                    setIsDropdownOpen(false);
                  }}
                >
                  <View style={styles.dropdownItemHeader}>
                    <Text style={[
                      styles.dropdownItemLabel,
                      isSelected && styles.dropdownItemLabelSelected
                    ]}>
                      {rc.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#a855f7" />}
                  </View>
                  <Text style={styles.dropdownItemDesc}>{rc.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* 4. Incident Location Input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>4. Incident Location</Text>
        <View style={styles.locationInputContainer}>
          <Ionicons name="location-outline" size={20} color="#a855f7" style={styles.locationInputIcon} />
          <TextInput
            style={styles.locationTextInput}
            placeholder="City, Area or coordinates (e.g. Gurugram, Sector 15)"
            placeholderTextColor="#64748b"
            value={locationStr}
            onChangeText={setLocationStr}
          />
          <TouchableOpacity 
            style={styles.detectLocationBtn}
            onPress={handleDetectLocation}
            disabled={isDetectingLocation}
          >
            {isDetectingLocation ? (
              <ActivityIndicator size="small" color="#a855f7" />
            ) : (
              <Ionicons name="locate" size={20} color="#a855f7" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Error message */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#f43f5e" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* 5. Action CTA */}
      <View style={styles.ctaContainer}>
        {!result && (
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!imageUri || !infraType) && styles.analyzeButtonDisabled
            ]}
            onPress={handleAnalyze}
            disabled={!imageUri || !infraType || isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.analyzeButtonText}>Gemini is analyzing...</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="sparkles" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.analyzeButtonText}>Analyze with Gemini</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {result && (
          <View style={styles.resultActionsContainer}>
            <TouchableOpacity style={styles.newReportButton} onPress={clearForm}>
              <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.newReportButtonText}>New Analysis</Text>
            </TouchableOpacity>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtnShare} onPress={handleShare}>
                <Ionicons name="share-social" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Share PNG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnLetter} onPress={() => setIsLetterModalOpen(true)}>
                <Ionicons name="mail" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Complaint Mail</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Result Card rendering */}
      {result && (
        <View style={styles.resultCardSection}>
          <Text style={styles.sectionLabel}>Gemini Safety Assessment</Text>
          <ReportCard report={result} cardRef={cardRef} />
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* Complaint Email / Letter Modal */}
      {result && (
        <Modal
          visible={isLetterModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsLetterModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Complaint Email Draft</Text>
                <TouchableOpacity onPress={() => setIsLetterModalOpen(false)}>
                  <Ionicons name="close" size={24} color="#f8fafc" />
                </TouchableOpacity>
              </View>

              {/* Email meta cards (To, Subject) */}
              <View style={styles.metaFieldsContainer}>
                {/* To Field */}
                <View style={styles.metaFieldItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaFieldLabel}>Send To</Text>
                    <Text style={styles.metaFieldValue}>{result.authority_email}</Text>
                  </View>
                  <TouchableOpacity style={styles.metaFieldCopyBtn} onPress={handleCopyEmail}>
                    <Ionicons 
                      name={copiedEmail ? "checkmark-done" : "copy-outline"} 
                      size={16} 
                      color={copiedEmail ? "#10b981" : "#94a3b8"} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Subject Field */}
                <View style={styles.metaFieldItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metaFieldLabel}>Subject</Text>
                    <Text style={styles.metaFieldValue} numberOfLines={1}>{result.complaint_email_subject}</Text>
                  </View>
                  <TouchableOpacity style={styles.metaFieldCopyBtn} onPress={handleCopySubject}>
                    <Ionicons 
                      name={copiedSubject ? "checkmark-done" : "copy-outline"} 
                      size={16} 
                      color={copiedSubject ? "#10b981" : "#94a3b8"} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Language Selector */}
              <View style={styles.langSelector}>
                <TouchableOpacity
                  style={[styles.langTab, letterLanguage === 'english' && styles.langTabActive]}
                  onPress={() => setLetterLanguage('english')}
                >
                  <Text style={[styles.langTabText, letterLanguage === 'english' && styles.langTabTextActive]}>
                    English
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langTab, letterLanguage === 'hindi' && styles.langTabActive]}
                  onPress={() => setLetterLanguage('hindi')}
                >
                  <Text style={[styles.langTabText, letterLanguage === 'hindi' && styles.langTabTextActive]}>
                    हिन्दी (Hindi)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Complaint Letter Body */}
              <ScrollView style={styles.letterScrollView}>
                <Text style={styles.letterText}>
                  {letterLanguage === 'english' ? result.complaint_letter_english : result.complaint_letter_hindi}
                </Text>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity style={styles.modalCopyBtn} onPress={handleCopyLetter}>
                  <Ionicons 
                    name={copiedText ? "checkmark-done" : "copy-outline"} 
                    size={16} 
                    color="#ffffff" 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={styles.modalBtnText}>
                    {copiedText ? "Copied!" : "Copy Body"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalSendBtn} onPress={handleOpenMailApp}>
                  <Ionicons 
                    name="mail-open-outline" 
                    size={16} 
                    color="#ffffff" 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={styles.modalBtnText}>Open Mail App</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a855f7',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  uploadBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  uploadBox: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    backgroundColor: '#1e293b50',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  uploadLeft: {
    marginRight: 2,
  },
  uploadRight: {
    marginLeft: 2,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadBoxText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  uploadSubtext: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    height: 220,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 14,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: (width - 42) / 2, // dynamic width fitting 2 columns nicely
    backgroundColor: '#1e293b60',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  typeButtonSelected: {
    backgroundColor: '#a855f7',
    borderColor: '#c084fc',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  typeButtonTextSelected: {
    color: '#ffffff',
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b60',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 14,
  },
  dropdownValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  dropdownValueDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    width: width - 100,
  },
  dropdownList: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  dropdownItemSelected: {
    backgroundColor: '#a855f71a',
  },
  dropdownItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  dropdownItemLabelSelected: {
    color: '#a855f7',
  },
  dropdownItemDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 14,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b60',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 52,
  },
  locationInputIcon: {
    marginRight: 8,
  },
  locationTextInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  detectLocationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f43f5e1a',
    borderWidth: 1,
    borderColor: '#f43f5e30',
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    gap: 8,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  ctaContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultActionsContainer: {
    gap: 10,
  },
  newReportButton: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  newReportButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnShare: {
    flex: 1,
    backgroundColor: '#a855f7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionBtnLetter: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resultCardSection: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  metaFieldsContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
    gap: 10,
  },
  metaFieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
  },
  metaFieldLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaFieldValue: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  metaFieldCopyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  langTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  langTabActive: {
    backgroundColor: '#a855f7',
  },
  langTabText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  langTabTextActive: {
    color: '#ffffff',
  },
  letterScrollView: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 16,
    maxHeight: 280,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  letterText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalActionsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  modalCopyBtn: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalSendBtn: {
    flex: 1.2,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
