import {
    addDoc,
    collection,
    doc,
    getDocs,
    onSnapshot,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { auth, db } from '@/config/firebase';
import Colors from '@/constants/Colors';
import { CoffeeChatRequest, User } from '@/types';

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CoffeeChatRequest[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen for pending requests
    const requestsQuery = query(
      collection(db, 'coffeeChatRequests'),
      where('toUserId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const requests: CoffeeChatRequest[] = [];
      for (const doc of snapshot.docs) {
        const request = doc.data() as CoffeeChatRequest;
        request.id = doc.id;
        
        // Get requester's user data
        const userDoc = await getDocs(
          query(collection(db, 'users'), where('uid', '==', request.fromUserId))
        );
        if (!userDoc.empty) {
          request.fromUser = userDoc.docs[0].data() as User;
        }
        
        requests.push(request);
      }
      setPendingRequests(requests);
      if (requests.length > 0) {
        setShowPendingModal(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!auth.currentUser) return;

    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '!=', auth.currentUser.uid)
      );
      const snapshot = await getDocs(usersQuery);
      const userData = snapshot.docs.map((doc) => ({
        ...(doc.data() as User),
        uid: doc.id,
      }));
      setUsers(userData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChat = (user: User) => {
    setSelectedUser(user);
    setShowRequestModal(true);
  };

  const confirmRequest = async () => {
    if (!selectedUser || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'coffeeChatRequests'), {
        fromUserId: auth.currentUser.uid,
        toUserId: selectedUser.uid,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      Alert.alert(
        'Request Sent',
        `Your coffee chat request has been sent to ${selectedUser.name}.`
      );
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Failed to send coffee chat request.');
    } finally {
      setShowRequestModal(false);
      setSelectedUser(null);
    }
  };

  const handleRequestResponse = async (request: CoffeeChatRequest, accept: boolean) => {
    try {
      await updateDoc(doc(db, 'coffeeChatRequests', request.id), {
        status: accept ? 'accepted' : 'declined',
        updatedAt: new Date(),
      });

      if (accept) {
        Alert.alert(
          'Request Accepted',
          `You've accepted the coffee chat request from ${request.fromUser?.name}.`
        );
      }
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request status.');
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <Image
        source={
          item.profilePictureUrl
            ? { uri: item.profilePictureUrl }
            : require('@/assets/images/default-avatar.png')
        }
        style={styles.profileImage}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userDetail}>
          {item.major} • Class of {item.graduationYear}
        </Text>
        {item.classes && item.classes.length > 0 && (
          <Text style={styles.userClasses}>
            Classes: {item.classes.join(', ')}
          </Text>
        )}
        {item.industryExperience && item.industryExperience.length > 0 && (
          <Text style={styles.userExperience}>
            Experience: {item.industryExperience.join(', ')}
          </Text>
        )}
        {item.interests && item.interests.length > 0 && (
          <Text style={styles.userInterests}>
            Interests: {item.interests.join(', ')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => handleRequestChat(item)}>
        <Text style={styles.requestButtonText}>Request Coffee Chat</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
      />

      {/* Request Confirmation Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Request</Text>
            <Text style={styles.modalText}>
              Are you sure you would like to send a request to{' '}
              {selectedUser?.name} for a coffee chat?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRequestModal(false)}>
                <Text style={styles.modalButtonText}>No thank you</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmRequest}>
                <Text style={styles.modalButtonText}>Yes, I'm sure!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pending Requests Modal */}
      <Modal
        visible={showPendingModal && pendingRequests.length > 0}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPendingModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pending Requests</Text>
            {pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <Text style={styles.requestText}>
                  {request.fromUser?.name} requests a coffee chat
                </Text>
                <View style={styles.requestButtons}>
                  <TouchableOpacity
                    style={[styles.requestActionButton, styles.declineButton]}
                    onPress={() => handleRequestResponse(request, false)}>
                    <Text style={styles.requestActionButtonText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestActionButton, styles.acceptButton]}
                    onPress={() => handleRequestResponse(request, true)}>
                    <Text style={styles.requestActionButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 8,
  },
  userClasses: {
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 4,
  },
  userExperience: {
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 4,
  },
  userInterests: {
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 8,
  },
  requestButton: {
    backgroundColor: Colors.cardinal,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: Colors.gray[700],
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: Colors.gray[300],
  },
  confirmButton: {
    backgroundColor: Colors.cardinal,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  requestItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    paddingVertical: 12,
  },
  requestText: {
    fontSize: 16,
    color: Colors.gray[700],
    marginBottom: 12,
  },
  requestButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  requestActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  declineButton: {
    backgroundColor: Colors.gray[300],
  },
  acceptButton: {
    backgroundColor: Colors.cardinal,
  },
  requestActionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
