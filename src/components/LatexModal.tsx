import type React from "react";
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Katex from "react-native-katex";
import kaTeX from "react-native-katex";

interface LatexModalProps {
  visible: boolean;
  onClose: () => void;
  content: string;
  theme: {
    background: string;
    surface: string;
    text: string;
    primary: string;
  };
  title: string;
}

const LatexModal: React.FC<LatexModalProps> = ({
  visible,
  onClose,
  content,
  theme,
  title,
}) => {
  const isLatex = content.trim().startsWith("\\") || content.includes("$$");

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View
        style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {title}
          </Text>
          <ScrollView style={styles.contentContainer}>
            {isLatex ? (
              <Katex
                style={{ color: theme.text }}
                config={{ displayMode: true }}
              >
                {content}
              </Katex>
            ) : (
              <Text style={[styles.plainText, { color: theme.text }]}>
                {content}
              </Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: 20,
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  contentContainer: {
    marginBottom: 20,
  },
  plainText: {
    fontSize: 16,
    lineHeight: 24,
  },
  closeButton: {
    padding: 14,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default LatexModal;
