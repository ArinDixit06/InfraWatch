import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

import ReportCard from './ReportCard';
import { shareReportCard } from '../utils/share';

export default function HistoryScreen({ activeTab, onNavigateToReport }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Complaint Letter Modal state
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [letterLanguage, setLetterLanguage] = useState('english');
  
  const [copiedText, setCopiedText] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  const cardRef = useRef(null);

  // Load history whenever this screen becomes active or activeTab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const historyStr = await AsyncStorage.getItem('infrawatch_history');
      if (historyStr) {
        setHistory(JSON.parse(historyStr));
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await AsyncStorage.removeItem('infrawatch_history');
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleCopyLetter = async () => {
    if (!selectedReport) return;
    const textToCopy = letterLanguage === 'english' 
      ? selectedReport.complaint_letter_english 
      : selectedReport.complaint_letter_hindi;
      
    await Clipboard.setStringAsync(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyEmail = async () => {
    if (!selectedReport) return;
    await Clipboard.setStringAsync(selectedReport.authority_email || '');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopySubject = async () => {
    if (!selectedReport) return;
    await Clipboard.setStringAsync(selectedReport.complaint_email_subject || '');
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleOpenMailApp = async () => {
    if (!selectedReport) return;
    const recipient = selectedReport.authority_email || '';
    const subject = encodeURIComponent(selectedReport.complaint_email_subject || '');
    const bodyText = letterLanguage === 'english' 
      ? selectedReport.complaint_letter_english 
      : selectedReport.complaint_letter_hindi;
    const body = encodeURIComponent(bodyText || '');

    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;
    Linking.openURL(mailtoUrl).catch((err) => {
      console.error("Failed to open mail app:", err);
      alert("Could not open your mail application. You can copy the email fields manually.");
    });
  };

  const handleShareSelected = async () => {
    if (!selectedReport) return;
    await shareReportCard(cardRef, selectedReport.imageUri);
  };

  const getSeverityColor = (sev) => {
    const s = sev ? sev.toUpperCase() : "MEDIUM";
    switch (s) {
      case "LOW": return '#10b981';
      case "MEDIUM": return '#fbbf24';
      case "HIGH": return '#ea580c';
      case "CRITICAL": return '#f43f5e';
      default: return '#94a3b8';
    }
  };

  const renderHistoryItem = ({ item }) => {
    const date = new Date(item.timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const severityColor = getSeverityColor(item.severity);

    return (
      <TouchableOpacity 
        style={styles.historyCard}
        onPress={() => setSelectedReport(item)}
      >
        <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
        <View style={styles.cardDetails}>
          <View style={styles.cardRow}>
            <Text style={styles.cardType} numberOfLines={1}>{item.damage_type}</Text>
            <View style={[styles.miniSeverityBadge, { backgroundColor: severityColor + '20', borderColor: severityColor }]}>
              <Text style={[styles.miniSeverityText, { color: severityColor }]}>{item.severity}</Text>
            </View>
          </View>
          <Text style={styles.cardAuthority} numberOfLines={1}>
            <Ionicons name="business" size={12} color="#64748b" style={{ marginRight: 4 }} />
            {item.authority_name}
          </Text>
          <Text style={styles.cardDate}>{date}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#475569" style={{ alignSelf: 'center', marginLeft: 8 }} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report History</Text>
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory}>
            <Ionicons name="trash-outline" size={16} color="#f43f5e" />
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="document-text-outline" size={48} color="#64748b" />
          </View>
          <Text style={styles.emptyTitle}>No Reports Yet</Text>
          <Text style={styles.emptyText}>
            Analyze damaged roads or bridges using Gemini Vision. Your reports will appear here.
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={onNavigateToReport}>
            <Ionicons name="camera-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.startBtnText}>Report Road Damage</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.timestamp}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <Modal
          visible={!!selectedReport}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedReport(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Report Analysis</Text>
                <TouchableOpacity onPress={() => setSelectedReport(null)}>
                  <Ionicons name="close" size={24} color="#f8fafc" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <ReportCard report={selectedReport} cardRef={cardRef} />
                <View style={styles.actionBlock}>
                  <TouchableOpacity style={styles.shareBtn} onPress={handleShareSelected}>
                    <Ionicons name="share-social" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>Share PNG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.letterBtn} onPress={() => setIsLetterModalOpen(true)}>
                    <Ionicons name="mail-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>Complaint Mail</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Complaint Letter Modal (Nested inside history) */}
      {selectedReport && (
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
                    <Text style={styles.metaFieldValue}>{selectedReport.authority_email}</Text>
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
                    <Text style={styles.metaFieldValue} numberOfLines={1}>{selectedReport.complaint_email_subject}</Text>
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
                  {letterLanguage === 'english' 
                    ? selectedReport.complaint_letter_english 
                    : selectedReport.complaint_letter_hindi}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f43f5e15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f43f5e30',
  },
  clearBtnText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startBtn: {
    backgroundColor: '#a855f7',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 40,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b60',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#0f172a',
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
    textTransform: 'capitalize',
  },
  miniSeverityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  miniSeverityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardAuthority: {
    fontSize: 12,
    color: '#94a3b8',
    marginVertical: 4,
  },
  cardDate: {
    fontSize: 11,
    color: '#64748b',
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
  modalScroll: {
    width: '100%',
  },
  actionBlock: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#a855f7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  letterBtn: {
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
