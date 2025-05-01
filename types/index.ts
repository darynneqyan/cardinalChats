export interface User {
  uid: string;
  email: string;
  name: string;
  graduationYear: string;
  major: string;
  profilePictureUrl?: string;
  classes?: string[];
  industryExperience?: string[];
  activities?: string[];
  interests?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CoffeeChatRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
  fromUser?: User;
  toUser?: User;
}

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  CompleteProfile: undefined;
};

export type MainTabParamList = {
  Users: undefined;
  Profile: undefined;
}; 