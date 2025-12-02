export const MOCK_USER = {
  _id: 'user_jade_1',
  name: 'Jade Emperor',
  email: 'jade@heaven.com',
  picture: 'https://i.pravatar.cc/150',
  joinedEvents: []
};

export const MOCK_EVENTS = [
  {
    _id: 'event_1',
    title: 'The Grand Tournament',
    date: '2024-12-25',
    time: '10:00',
    location: 'Castle Courtyard',
    category: 'Social',
    image: 'https://via.placeholder.com/150',
    creatorId: 'merlin_1',
    creatorName: 'Merlin',
    attendees: ['user_123', 'arthur_1'], // User is here
    comments: [
      { _id: 'c1', userId: 'arthur_1', userName: 'Arthur', text: 'I shall bring Excalibur!' }
    ]
  },
  {
    _id: 'evt_1',
    title: 'Dragon Boat Festival',
    date: '2025-06-10', 
    time: '10:00',
    location: 'Pearl River',
    category: 'Outdoor',
    creatorId: 'user_other',
    creatorName: 'Qu Yuan',
	attendees: ['user_123', 'arthur_1'], // User is here
    comments: [
      { _id: 'c1', userId: 'arthur_1', userName: 'Arthur', text: 'I shall bring Excalibur!' }
    ]
  }
];