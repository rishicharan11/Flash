// Contact names, subjects, times and customer details captured from PR-70 Inbox C.
export const customers = [
  ['CUST-0001', 'Jain Family', 'JF', 'Hyderabad', 'B2C'],
  ['CUST-0002', 'Rishi Charan', 'RC', 'Bengaluru', 'B2B'],
  ['CUST-0003', 'Pragyam Soni', 'PS', 'Mumbai', 'Sub-Agent'],
  ['CUST-0004', 'Yakshith', 'Y', 'Mangalore', 'Other'],
  ['CUST-0005', 'Aarav Singh', 'AS', 'Delhi', 'B2C'],
  ['CUST-0006', 'Sonia Bhatia', 'SB', 'Pune', 'B2B'],
  ['CUST-0007', 'Manish Kumar', 'MK', 'Chennai', 'Sub-Agent'],
  ['CUST-0008', 'Vani Patel', 'VP', 'Ahmedabad', 'Other'],
  ['CUST-0009', 'Rohan Ghosh', 'RG', 'Kolkata', 'B2C'],
  ['CUST-0010', 'Neha Sharma', 'NS', 'Noida', 'B2C'],
  ['CUST-0011', 'Deepak Prasad', 'DP', 'Lucknow', 'B2C'],
  ['CUST-0012', 'Tanvi Singh', 'TS', 'Jaipur', 'B2C'],
  ['CUST-0013', 'Ankit Kapoor', 'AK', 'Surat', 'B2C'],
  ['CUST-0014', 'Maya Joshi', 'MJ', 'Indore', 'B2C'],
  ['CUST-0015', 'Rahul Agarwal', 'RA', 'Ghaziabad', 'B2C'],
  ['CUST-0016', 'Pooja Qureshi', 'PQ', 'Vadodara', 'B2C'],
].map(([id, name, initials, location, type]) => ({ id, name, initials, location, type }));

export const initialConversations = [
  ['jain', 'CUST-0001', 'Re: Singapore itinerary and document checklist', 'Yesterday', false, false],
  ['rishi', 'CUST-0002', 'Re: Your Shimla booking is confirmed', '10:18 AM', true, false],
  ['aarav', 'CUST-0005', 'Dietary requirements for the Delhi group', '8:36 AM', true, false],
  ['pragyam', 'CUST-0003', 'You: Re: Mumbai group fare request', 'Yesterday', true, false],
  ['yakshith', 'CUST-0004', 'You: Re: Airport pickup details', 'Yesterday', false, false],
  ['sonia', 'CUST-0006', 'Change of Pune departure date', 'Mon', true, false],
  ['manish', 'CUST-0007', 'Re: Chennai group rooming list', 'Mon', false, true],
  ['vani', 'CUST-0008', 'Ahmedabad hotel options', 'Sun', true, false],
  ['rohan', 'CUST-0009', 'Re: Kolkata family trip proposal', 'Sat', false, true],
  ['neha', 'CUST-0010', 'Passport details for four travellers', 'Fri', true, true],
  ['deepak', 'CUST-0011', 'Re: Payment receipt for your booking', 'Thu', false, true],
  ['tanvi', 'CUST-0012', 'Jaipur trip check-in time', 'Wed', true, false],
].map(([key, customerId, preview, time, unread, attachment]) => {
  const customer = customers.find((item) => item.id === customerId);
  return { ...customer, id: `conversation-${key}-email`, customerId, preview, time, unread, attachment };
});

// This conversation body was captured directly. Other bodies are demo content
// derived from their captured subject; they are not exported private messages.
export const rishiMessages = [
  {
    subject: 'Your Shimla booking is confirmed',
    sender: 'Agency sender not recorded · Paryatech Travel to Rishi Charan',
    time: '10:00 AM',
    body: 'Hi Rishi,\n\nYour Shimla booking is confirmed. I’ve shared the next steps below for your reference.',
  },
  {
    subject: 'Re: Your Shimla booking is confirmed',
    sender: 'Rishi Charan to You',
    time: '10:18 AM',
    body: 'Thanks. Could you resend the hotel voucher in this thread?',
  },
];

export const templates = {
  documents: {
    subject: 'Request documents',
    body: 'Hello,\n\nPlease share the missing travel documents so we can proceed with your booking.\n\nThank you,\nParyatech Travel',
  },
  acceptance: {
    subject: 'Request acceptance',
    body: 'Hello,\n\nPlease review your travel proposal and confirm your acceptance.\n\nThank you,\nParyatech Travel',
  },
  letter: {
    subject: 'Request supporting letter',
    body: 'Hello,\n\nPlease share the supporting letter from your employer or sponsor for your travel application.\n\nThank you,\nParyatech Travel',
  },
};

export function filterConversations(items, filter = 'all', search = '') {
  const term = search.trim().toLocaleLowerCase();
  return items.filter((item) => {
    const matchesState = filter === 'all' || (filter === 'read' && !item.unread)
      || (filter === 'unread' && item.unread) || (filter === 'attachments' && item.attachment);
    return matchesState && (!term || `${item.name} ${item.preview} ${item.location}`.toLocaleLowerCase().includes(term));
  });
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}
