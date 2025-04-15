# Firebase Authentication Integration

This document explains how to integrate Firebase authentication with the Email AI backend.

## Endpoints

### POST /firebase-auth/login

Authenticates a user with Firebase and either creates a new user in MongoDB or updates an existing one.

**Request Body:**

```json
{
  "email": "user@example.com",
  "firebaseUid": "firebase-generated-uid"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "_id": "mongodb-user-id",
    "email": "user@example.com",
    "firebaseUid": "firebase-generated-uid",
    "gmailEmail": null,
    "lastUpdated": "2023-01-01T00:00:00.000Z",
    "emailMetadata": [],
    "agents": [],
    "defaultAgentId": null,
    "resolvedThreads": [],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Email and Firebase UID required"
}
```

**Error Response (500):**

```json
{
  "success": false,
  "message": "Error authenticating user"
}
```

### GET /firebase-auth/user/:firebaseUid

Gets a user by their Firebase UID.

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "_id": "mongodb-user-id",
    "email": "user@example.com",
    "firebaseUid": "firebase-generated-uid",
    "gmailEmail": null,
    "lastUpdated": "2023-01-01T00:00:00.000Z",
    "emailMetadata": [],
    "agents": [],
    "defaultAgentId": null,
    "resolvedThreads": [],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "User not found"
}
```

## Frontend Integration

In your frontend application, after authenticating with Firebase, send the user's email and Firebase UID to the backend:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setError("");
    setLoading(true);

    // Authenticate with Firebase
    const userCredential = await login(email, password);

    // Save user data in MongoDB
    const response = await fetch("http://localhost:3001/firebase-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        firebaseUid: userCredential.user.uid,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      setError(data.message || "Failed to sign in");
    }
  } catch (err) {
    setError("Failed to sign in");
    console.error(err);
  }
  setLoading(false);
};
```

For sign-up, the process is similar. After creating a user with Firebase, save the user data to MongoDB using the same endpoint.

## Notes

- The backend will create a new user if one doesn't exist, or update an existing user's Firebase UID if it has changed.
- User data is automatically populated with default values when a new user is created, including a default classifier model.
- The `firebaseUid` field is required and must match the one provided by Firebase authentication.
