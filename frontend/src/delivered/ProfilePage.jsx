import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import apiClient from '../api/client';
import '../styles/ProfilePageStyle.css';

const AVATAR_SEEDS = ['initials', 'Ocean', 'River', 'Rain', 'Wave', 'Bubble'];

const SAMPLE_STATIONS = [
    { id: 1, name: 'AquaPure Station', emoji: '💧', distance: '10.5 km', pricePerGallon: 25, deliveryFee: 20, waterTypes: ['Purified', 'Alkaline'], eta: '15-20 min', rating: 4.8, open: true },
    { id: 2, name: 'Crystal Clear Water', emoji: '🌊', distance: '1.2 km', pricePerGallon: 23, deliveryFee: 25, waterTypes: ['Purified', 'Mineral'], eta: '20-25 min', rating: 4.6, open: true },
    { id: 3, name: 'Blue Spring Refill', emoji: '⛲', distance: '2.0 km', pricePerGallon: 28, deliveryFee: 15, waterTypes: ['Alkaline', 'Mineral'], eta: '25-30 min', rating: 4.9, open: false },
    { id: 4, name: 'H2O Express', emoji: '🚰', distance: '2.5 km', pricePerGallon: 22, deliveryFee: 30, waterTypes: ['Purified'], eta: '10-15 min', rating: 4.5, open: true },
    { id: 5, name: 'Pure Drop Refill', emoji: '💧', distance: '3.1 km', pricePerGallon: 26, deliveryFee: 18, waterTypes: ['Alkaline'], eta: '20-30 min', rating: 4.7, open: true },
    { id: 6, name: 'Mountain Spring Co.', emoji: '⛰️', distance: '3.8 km', pricePerGallon: 30, deliveryFee: 20, waterTypes: ['Mineral'], eta: '30-40 min', rating: 4.9, open: true }
];

const ProfilePage = ({ navigate }) => {
    const { user, logout } = useAuth();
    const { orders } = useOrders();

    const [isEditing, setIsEditing] = useState(false);
    const [accountData, setAccountData] = useState({ name: '', phone: '', email: '', paymentMethod: 'COD', is_staff: false, points: 0 });
    
    const [tempIndex, setTempIndex] = useState(0); 
    const [savedAvatar, setSavedAvatar] = useState({ type: 'initials', seed: '' });
    const [isSavingAvatar, setIsSavingAvatar] = useState(false);

    const [showPassModal, setShowPassModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showAppReviewModal, setShowAppReviewModal] = useState(false);
    const [showStationReviewModal, setShowStationReviewModal] = useState(false);
    
    const [passData, setPassData] = useState({ current_password: '', new_password: '', re_new_password: '' });
    const [addresses, setAddresses] = useState([]);
    const [newAddress, setNewAddress] = useState('');
    
    const [ratings, setRatings] = useState({ app: 0 });
    const [stationRatingsMap, setStationRatingsMap] = useState({});
    const [settings, setSettings] = useState({ sms: true, email: true });

    const updateLocalState = (data) => {
        setAccountData({
            name: data.user_details?.username || '',
            phone: data.phone || '',
            email: data.user_details?.email || '',
            paymentMethod: data.payment_method || 'COD',
            is_staff: data.user_details?.is_staff || false,
            points: data.points || 0
        });
        
        setAddresses(data.addresses || []);
        
        const loadedType = data.avatar_type || 'initials';
        const loadedSeed = data.avatar_seed || '';
        setSavedAvatar({ type: loadedType, seed: loadedSeed });
        
        const startIdx = loadedType === 'initials' ? 0 : AVATAR_SEEDS.indexOf(loadedSeed);
        setTempIndex(startIdx === -1 ? 0 : startIdx);

        setRatings({ app: data.app_rating || 0 });

        const sMap = {};
        if (data.rated_stations) {
            data.rated_stations.forEach(id => { sMap[id] = 5; });
        }
        setStationRatingsMap(sMap);
        
        setSettings({ sms: data.sms_notifications ?? true, email: data.email_notifications ?? true });
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const res = await apiClient.get('/users/profiles/me/');
                updateLocalState(res.data);
            } catch (err) { console.error("Fetch error:", err); }
        };
        fetchProfileData();
    }, []);

    const handleNextAvatar = () => setTempIndex((prev) => (prev + 1) % AVATAR_SEEDS.length);
    const handlePrevAvatar = () => setTempIndex((prev) => (prev - 1 + AVATAR_SEEDS.length) % AVATAR_SEEDS.length);

    const handleConfirmAvatar = async () => {
        setIsSavingAvatar(true);
        const selectedSeed = AVATAR_SEEDS[tempIndex];
        const newType = selectedSeed === 'initials' ? 'initials' : 'lorelei';
        const newSeed = selectedSeed === 'initials' ? '' : selectedSeed;

        try {
            await apiClient.patch('/users/profiles/me/', { avatar_type: newType, avatar_seed: newSeed });
            setSavedAvatar({ type: newType, seed: newSeed });
            alert("Avatar updated successfully!");
        } catch (err) { alert("Failed to save avatar."); } 
        finally { setIsSavingAvatar(false); }
    };

    const hasChanged = (AVATAR_SEEDS[tempIndex] !== savedAvatar.seed) && 
                     !(AVATAR_SEEDS[tempIndex] === 'initials' && savedAvatar.type === 'initials');

    const handleSaveAccount = async () => {
        try {
            await apiClient.patch('/users/profiles/me/', {
                name: accountData.name, email: accountData.email, phone: accountData.phone, payment_method: accountData.paymentMethod,
            });
            setIsEditing(false);
            alert("Account information saved successfully!");
        } catch (err) { alert("Failed to save account info."); }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passData.new_password !== passData.re_new_password) return alert("New passwords do not match!");
        try {
            await apiClient.post('/auth/users/set_password/', { current_password: passData.current_password, new_password: passData.new_password });
            alert("Password updated successfully!");
            setShowPassModal(false);
            setPassData({ current_password: '', new_password: '', re_new_password: '' });
        } catch (err) { alert(err.response?.data?.current_password || "Failed to update password."); }
    };

    const handleToggleSetting = async (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        try { await apiClient.patch('/users/profiles/me/', { sms_notifications: newSettings.sms, email_notifications: newSettings.email }); } 
        catch (err) { console.error("Failed to save settings"); }
    };

    // --- ADDRESS HANDLERS ---
    const handleAddAddress = async () => {
        if (!newAddress.trim()) return;
        if (addresses.length >= 3) return alert("You can only have a maximum of 3 addresses.");
        try {
            await apiClient.post('/users/profiles/add_address/', { address_text: newAddress, is_default: addresses.length === 0 });
            const res = await apiClient.get('/users/profiles/me/');
            setAddresses(res.data.addresses);
            setNewAddress('');
        } catch (err) { alert("Failed to add address."); }
    };

    const handleRemoveAddress = async (addressId) => { 
        if (!window.confirm("Are you sure you want to remove this address?")) return;
        try {
            await apiClient.delete(`/users/profiles/remove_address/${addressId}/`);
            const res = await apiClient.get('/users/profiles/me/');
            setAddresses(res.data.addresses);
        } catch (error) { alert("Failed to remove address from server."); }
    };

    const handleSetDefaultAddress = async (idToDefault) => {
        try {
            await apiClient.patch(`/users/profiles/set_default_address/${idToDefault}/`);
            const res = await apiClient.get('/users/profiles/me/');
            setAddresses(res.data.addresses);
        } catch (err) { alert("Failed to save default address preference."); }
    };

    const handleDeactivate = async () => {
        if (window.confirm("Are you sure you want to deactivate your account?")) {
            try {
                await apiClient.post('/users/profiles/deactivate/');
                logout();
                navigate('welcome');
            } catch (err) { alert("Failed to deactivate account."); }
        }
    };

    const handleSaveAppRating = async (ratingVal) => {
        try { 

            await apiClient.patch('/users/profiles/me/', { app_rating: ratingVal }); 
            setShowAppReviewModal(false);
            const res = await apiClient.get('/users/profiles/me/');
            updateLocalState(res.data);
            
            if (ratings.app === 0) alert("You earned 1.0 points for your first app review!");
            else alert("Rating updated!");
        } catch (err) { console.error("Failed to save app rating."); }
    };

    const handleSaveStationRating = async (stationId, ratingVal) => {
        try {
            await apiClient.patch('/users/profiles/me/', { rated_station_id: stationId, station_rating: ratingVal });

            const res = await apiClient.get('/users/profiles/me/');
            updateLocalState(res.data);
            
            if (!stationRatingsMap[stationId]) alert("You earned 0.2 points for reviewing this station!");
        } catch (err) { console.error("Failed to save station rating."); }
    };

    return (
        <div className="profile-layout">
            <div className="profile-left">
                <div className="profile-card">
                    <div className="avatar-selection-wrapper">
                        <button className="nav-arrow" onClick={handlePrevAvatar}>‹</button>
                        
                        <div className="profile-circle-container">
                            <img 
                                src={
                                    AVATAR_SEEDS[tempIndex] === 'initials'
                                    ? `https://api.dicebear.com/7.x/initials/svg?seed=${accountData.name}&backgroundColor=125e98`
                                    : `https://api.dicebear.com/7.x/lorelei/svg?seed=${AVATAR_SEEDS[tempIndex]}&backgroundColor=e0f2fe`
                                } 
                                alt="Avatar Preview" 
                                className="avatar-img" 
                            />
                        </div>

                        <button className="nav-arrow" onClick={handleNextAvatar}>›</button>
                    </div>

                    {/* Avatar Button */}
                    <div style={{ minHeight: '30px', marginTop: '10px' }}>
                        {hasChanged && (
                            <button className="confirm-avatar-btn" onClick={handleConfirmAvatar} disabled={isSavingAvatar}>
                                {isSavingAvatar ? 'Saving...' : 'Choose'}
                            </button>
                        )}
                    </div>
                    
                    {/* GREETING & ADMIN LABEL */}
                    <div className="name-container">
                        <div className="greeting-text">Hello, {accountData.name || 'User'}</div>
                        {accountData.is_staff && <div className="admin-subtext">Admin</div>} 
                    </div>
                </div>

                <div className="profile-stats-card">
                    <div className="pstat">
                        <div className="pstat-val">{orders ? orders.length : 0}</div>
                        <div className="pstat-label">Total Orders</div>
                    </div>
                    <button className="sidebar-btn" onClick={() => navigate('history')}>📜 Order History</button>
                    
                    <div className="pstat">
                        {/* Notice we NO LONGER calculate order points here. The backend does it! */}
                        <div className="pstat-val">{(accountData.points || 0).toFixed(1)}</div>
                        <div className="pstat-label">Points Earned</div>
                    </div>
                    <button className="sidebar-btn" onClick={() => setShowStationReviewModal(true)}>⭐ Review Stations</button>
                    
                    {/* Optional: Change button text if already rated */}
                    <button className="sidebar-btn" onClick={() => setShowAppReviewModal(true)}>
                        {ratings.app > 0 ? "✅ Update App Review" : "📱 Review App"}
                    </button>
                    
                    <button className="sidebar-btn" onClick={() => setShowHelpModal(true)}>❓ Help Centre</button>
                </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="profile-right">
                <div className="profile-section-title" style={{ fontWeight: 'bold', marginBottom: '10px' }}>Account Information</div>
                <div className="profile-info-card">
                    <div className="pi-row"><span>Name</span>{isEditing ? <input value={accountData.name} onChange={e => setAccountData({...accountData, name: e.target.value})} /> : <strong>{accountData.name}</strong>}</div>
                    <div className="pi-row"><span>Phone</span>{isEditing ? <input value={accountData.phone} onChange={e => setAccountData({...accountData, phone: e.target.value})} /> : <strong>{accountData.phone || 'Not provided'}</strong>}</div>
                    <div className="pi-row"><span>Email</span>{isEditing ? <input type="email" value={accountData.email} onChange={e => setAccountData({...accountData, email: e.target.value})} /> : <strong>{accountData.email}</strong>}</div>
                    <div className="pi-row">
                        <span>Payment Method</span>
                        {isEditing ? (
                            <select value={accountData.paymentMethod} onChange={e => setAccountData({...accountData, paymentMethod: e.target.value})} className="inline-select">
                                <option value="COD">COD</option><option value="GCash">GCash</option><option value="Maya">Maya</option>
                            </select>
                        ) : <strong>{accountData.paymentMethod}</strong>}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px', marginBottom: '15px' }}>
                        {isEditing 
                            ? <button onClick={handleSaveAccount} style={{ padding: '8px 16px', background: 'var(--blue-deep)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Changes</button>
                            : <button onClick={() => setIsEditing(true)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--blue-deep)', border: '1px solid var(--blue-deep)', borderRadius: '5px', cursor: 'pointer' }}>Edit Account</button>
                        }
                    </div>

                    <div className="address-container">
                        {addresses.length < 3 ? (
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Enter new address..." style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid var(--border)' }} />
                                <button className="add-addr-btn" onClick={handleAddAddress} style={{ padding: '8px 16px', color: 'white', borderRadius: '5px', cursor: 'pointer', backgroundColor: 'var(--blue-deep)', border: 'none' }}>+ Add</button>
                            </div>
                        ) : <p style={{ fontSize: '12px', color: 'gray', marginTop: '5px', marginBottom: '15px' }}>Address limit reached (3/3). Remove one to add a new location.</p>}

                        {addresses.map(addr => (
                            <div key={addr.id} className={`addr-pill ${addr.is_default ? 'is-default' : ''}`}>
                                <div className="addr-info"><span>{addr.address_text || addr.text}</span>{addr.is_default && <span className="default-badge"> (Default)</span>}</div>
                                <div className="addr-actions">
                                    {!addr.is_default && <button className="set-def-btn" onClick={() => handleSetDefaultAddress(addr.id)}>Set Default</button>}
                                    <button className="del-btn" onClick={() => handleRemoveAddress(addr.id)}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="profile-section-title" style={{ fontWeight: 'bold', marginTop: '24px', marginBottom: '10px' }}>Settings</div>
                <div className="profile-menu">
                    <div className="profile-menu-item no-click"><span>SMS Notifications</span><input type="checkbox" checked={settings.sms} onChange={() => handleToggleSetting('sms')} /></div>
                    <div className="profile-menu-item no-click"><span>Email Notifications</span><input type="checkbox" checked={settings.email} onChange={() => handleToggleSetting('email')} /></div>
                    <button className="profile-menu-item" onClick={() => setShowPassModal(true)}><span>Change Password</span><span className="chevron">›</span></button>
                    <button className="profile-menu-item danger-item" onClick={handleDeactivate}><span>Deactivate Account</span><span className="chevron">›</span></button>
                </div>

                {/* --- MODALS --- */}
                {/* Password Modal */}
                {showPassModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Change Password</h3>
                            <form onSubmit={handlePasswordChange}>
                                <input type="password" placeholder="Current Password" required onChange={e => setPassData({...passData, current_password: e.target.value})} />
                                <input type="password" placeholder="New Password" required onChange={e => setPassData({...passData, new_password: e.target.value})} />
                                <input type="password" placeholder="Confirm New Password" required onChange={e => setPassData({...passData, re_new_password: e.target.value})} />
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowPassModal(false)}>Cancel</button>
                                    <button type="submit" className="save-btn">Update Password</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Help Centre Modal */}
                {showHelpModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '500px' }}>
                            <h3 style={{ color: 'var(--blue-deep)' }}>❓ Help Centre</h3>
                            <div style={{ marginBottom: '20px' }}><p><strong>Email Us:</strong> support@refillonwheels.com</p><p><strong>Call Us:</strong> (088) 123-4567</p></div>
                            <h4 style={{ marginBottom: '10px' }}>Frequently Asked Questions</h4>
                            <div style={{ fontSize: '14px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div><strong>Q: How long does delivery usually take?</strong><p>A: Most orders are delivered within 45 minutes to 1 hour depending on your zone.</p></div>
                                <div><strong>Q: Can I change my default address?</strong><p>A: Yes! Go to the Account section on this page and click 'Set Default' on your preferred address.</p></div>
                                <div><strong>Q: How are Points Earned calculated?</strong><p>A: You earn points based on the total orders delivered to you.</p></div>
                            </div>
                            <div className="modal-actions" style={{ marginTop: '20px' }}>
                                <button type="button" className="save-btn" onClick={() => setShowHelpModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* App Review Modal */}
                {showAppReviewModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ textAlign: 'center' }}>
                            <h3>Rate Our App</h3>
                            <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>Let us know how we're doing!</p>
                            <div className="star-rating-container">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star} onClick={() => handleSaveAppRating(star)} className={ratings.app >= star ? 'star filled' : 'star'}>★</span>
                                ))}
                            </div>
                            <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
                                <button type="button" onClick={() => setShowAppReviewModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Station Review Modal */}
                {showStationReviewModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                            <h3>Review Refill Stations</h3>
                            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '15px' }}>Earn 0.2 points for every station you review!</p>
                            
                            <div className="station-review-list">
                                {SAMPLE_STATIONS.map(station => (
                                    <div key={station.id} className="station-review-card">
                                        <div className="station-info-header">
                                            <span style={{ fontSize: '20px' }}>{station.emoji}</span>
                                            <strong>{station.name}</strong>
                                        </div>
                                        <div className="star-rating-container small">
                                            {[1, 2, 3, 4, 5].map(star => {
                                                const currentRating = stationRatingsMap[station.id] || 0;
                                                return (
                                                    <span key={star} onClick={() => handleSaveStationRating(station.id, star)} className={currentRating >= star ? 'star filled' : 'star'}>★</span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-actions" style={{ marginTop: '20px' }}>
                                <button type="button" className="save-btn" onClick={() => setShowStationReviewModal(false)}>Done</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;