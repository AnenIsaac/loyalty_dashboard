import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  image?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  expiresAt?: string;
  redemptionCount: number;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  image?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
}

interface MockDataState {
  rewards: Reward[];
  promotions: Promotion[];
  addReward: (reward: Omit<Reward, 'id' | 'createdAt' | 'redemptionCount'>) => void;
  editReward: (id: string, reward: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  addPromotion: (promotion: Omit<Promotion, 'id' | 'createdAt'>) => void;
  editPromotion: (id: string, promotion: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
}

// Initial mock data
const initialRewards: Reward[] = [
  {
    id: '1',
    name: 'Free Burger',
    description: 'Redeem for a free burger of your choice',
    pointsCost: 100,
    image: '/images/burger.png',
    status: 'active',
    createdAt: '2023-04-10T10:00:00Z',
    redemptionCount: 24
  },
  {
    id: '2',
    name: 'Free Drink',
    description: 'Redeem for a free drink with any meal',
    pointsCost: 50,
    image: '/images/drink.png',
    status: 'active',
    createdAt: '2023-04-11T10:00:00Z',
    redemptionCount: 42
  },
  {
    id: '3',
    name: '20% Discount',
    description: 'Get 20% off your next order',
    pointsCost: 75,
    image: '/images/discount.png',
    status: 'active',
    createdAt: '2023-04-12T10:00:00Z',
    redemptionCount: 18
  }
];

const initialPromotions: Promotion[] = [
  {
    id: '1',
    name: 'Summer Special',
    description: 'Earn double points on all purchases during summer',
    image: '/images/summer-special.jpg',
    startDate: '2023-06-01T00:00:00Z',
    endDate: '2023-08-31T23:59:59Z',
    status: 'active',
    createdAt: '2023-05-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Holiday Bonus',
    description: 'Earn triple points during holiday weekends',
    image: '/images/holiday.jpg',
    startDate: '2023-12-24T00:00:00Z',
    endDate: '2024-01-01T23:59:59Z',
    status: 'inactive',
    createdAt: '2023-11-01T10:00:00Z'
  },
  {
    id: '3',
    name: 'Weekend Brunch',
    description: 'Double points for brunch orders on weekends',
    image: '/images/brunch.jpg',
    startDate: '2023-05-01T00:00:00Z',
    endDate: '2023-12-31T23:59:59Z',
    status: 'active',
    createdAt: '2023-04-20T10:00:00Z'
  }
];

// Create store with persistence
export const useMockDataStore = create<MockDataState>()(
  persist(
    (set) => ({
      rewards: initialRewards,
      promotions: initialPromotions,
      
      addReward: (reward) => set((state) => ({
        rewards: [
          ...state.rewards,
          {
            ...reward,
            id: `reward-${Date.now()}`,
            createdAt: new Date().toISOString(),
            redemptionCount: 0
          }
        ]
      })),
      
      editReward: (id, reward) => set((state) => ({
        rewards: state.rewards.map((item) => 
          item.id === id ? { ...item, ...reward } : item
        )
      })),
      
      deleteReward: (id) => set((state) => ({
        rewards: state.rewards.filter((item) => item.id !== id)
      })),
      
      addPromotion: (promotion) => set((state) => ({
        promotions: [
          ...state.promotions,
          {
            ...promotion,
            id: `promotion-${Date.now()}`,
            createdAt: new Date().toISOString()
          }
        ]
      })),
      
      editPromotion: (id, promotion) => set((state) => ({
        promotions: state.promotions.map((item) => 
          item.id === id ? { ...item, ...promotion } : item
        )
      })),
      
      deletePromotion: (id) => set((state) => ({
        promotions: state.promotions.filter((item) => item.id !== id)
      }))
    }),
    {
      name: 'zawadii-mock-data'
    }
  )
);

// Simulated API functions with delays to mimic real API calls
export const mockApi = {
  async getRewards(): Promise<Reward[]> {
    const { rewards } = useMockDataStore.getState();
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...rewards];
  },
  
  async getRewardById(id: string): Promise<Reward | undefined> {
    const { rewards } = useMockDataStore.getState();
    await new Promise(resolve => setTimeout(resolve, 300));
    return rewards.find(reward => reward.id === id);
  },
  
  async createReward(reward: Omit<Reward, 'id' | 'createdAt' | 'redemptionCount'>): Promise<Reward> {
    const { addReward } = useMockDataStore.getState();
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newReward = {
      ...reward,
      id: `reward-${Date.now()}`,
      createdAt: new Date().toISOString(),
      redemptionCount: 0
    };
    
    addReward(reward);
    return newReward;
  },
  
  async updateReward(id: string, reward: Partial<Reward>): Promise<Reward> {
    const { editReward, rewards } = useMockDataStore.getState();
    await new Promise(resolve => setTimeout(resolve, 600));
    
    editReward(id, reward);
    const updated = rewards.find(r => r.id === id);
    
    if (!updated) {
      throw new Error('Reward not found');
    }
    
    return updated;
  },
  
  async deleteReward(id: string): Promise<void> {
    const { deleteReward } = useMockDataStore.getState();
    await new Promise(resolve => setTimeout(resolve, 500));
    deleteReward(id);
  },
  
  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    const { promotions } = useMockDataStore.getState();
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...promotions];
  },
  
  async getPromotionById(id: string): Promise<Promotion | undefined> {
    const { promotions } = useMockDataStore.getState();
    await new Promise(resolve => setTimeout(resolve, 300));
    return promotions.find(promotion => promotion.id === id);
  },
  
  async createPromotion(promotion: Omit<Promotion, 'id' | 'createdAt'>): Promise<Promotion> {
    const { addPromotion } = useMockDataStore.getState();
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newPromotion = {
      ...promotion,
      id: `promotion-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    addPromotion(promotion);
    return newPromotion;
  },
  
  async updatePromotion(id: string, promotion: Partial<Promotion>): Promise<Promotion> {
    const { editPromotion, promotions } = useMockDataStore.getState();
    await new Promise(resolve => setTimeout(resolve, 600));
    
    editPromotion(id, promotion);
    const updated = promotions.find(p => p.id === id);
    
    if (!updated) {
      throw new Error('Promotion not found');
    }
    
    return updated;
  },
  
  async deletePromotion(id: string): Promise<void> {
    const { deletePromotion } = useMockDataStore.getState();
    await new Promise(resolve => setTimeout(resolve, 500));
    deletePromotion(id);
  }
}; 