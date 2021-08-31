export const saveAuthToken = (token) => {
  if (!token) {
    return;
  }

  try {
    localStorage.setItem('token', token);
  } catch (err) {
    console.error(err);
  }
};

export const getAuthToken = () => localStorage.getItem('token');

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

export const saveRefreshToken = (token) => {
  if (!token) {
    return;
  }

  try {
    localStorage.setItem('refresh-token', token);
  } catch (err) {
    console.error(err);
  }
};

export const getRefreshToken = () => localStorage.getItem('refresh-token');

export const removeRefreshToken = () => {
  localStorage.removeItem('refresh-token');
};

export const saveCurrentUser = (data) => {
  if (!data) {
    return;
  }

  try {
    localStorage.setItem('current-user', JSON.stringify(data));
  } catch (err) {
    console.error(err);
  }
};

export const getCurrentUser = () => JSON.parse(localStorage.getItem('current-user') || '{}');

export const removeCurrentUser = () => {
  localStorage.removeItem('current-user');
};
