import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

export function AdminRoute({ onBack }) {
    // TEMPORARY BYPASS: Directly render the dashboard without login
    return <AdminDashboard onBack={onBack || (() => (window.location.href = '/'))} />;
}
