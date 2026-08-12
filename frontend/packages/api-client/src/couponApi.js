import axiosClient from './axiosClient.js';

/**
 * @param {FormData} formData - expected fields: title, clientName (optional),
 * code, discountDescription, file (optional image)
 */
export async function uploadCoupon(formData) {
  return axiosClient.post('/coupons', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function listCoupons() {
  return axiosClient.get('/coupons');
}

export async function listAllCoupons() {
  return axiosClient.get('/coupons/all');
}

export async function deleteCoupon(id) {
  return axiosClient.delete(`/coupons/${id}`);
}

export async function listCouponsTrash() {
  return axiosClient.get('/coupons/trash');
}

export async function restoreCoupon(id) {
  return axiosClient.post(`/coupons/${id}/restore`);
}

export async function permanentlyDeleteCoupon(id) {
  return axiosClient.delete(`/coupons/${id}/permanent`);
}

/** Trashes every active coupon belonging to one client at once. */
export async function deleteCouponsByClient(clientName) {
  return axiosClient.delete('/coupons/by-client', { params: { clientName } });
}

/** Assigns one coupon to a game on every screen id listed - one screen for a
 * single assignment, many for a bulk-assign. */
export async function assignCoupon(screenIds, gameType, couponId) {
  return axiosClient.post('/admin/coupons/assign', { screenIds, gameType, couponId });
}

export async function unassignCoupon(screenId, gameType, couponId) {
  return axiosClient.delete(`/admin/coupons/${screenId}/assign`, { params: { gameType, couponId } });
}

export async function listCouponAssignments() {
  return axiosClient.get('/admin/coupons/assignments');
}
