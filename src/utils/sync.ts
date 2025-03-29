import { useSettingStore } from "../store/setting";

/**
 * Synchronize history with the server
 * @param history History needs to be synchronized
 * @returns Synchronization result
 */
export async function syncHistoryWithServer(history: ResearchHistory): Promise<{success: boolean; data?: any; error?: string}> {
  try {
    const { accessPassword, syncId } = useSettingStore.getState();
    
    // Check if password and sync ID are configured
    if (!accessPassword || !syncId) {
      return { success: false, error: "accessPassword or syncId is not configured" };
    }
    
    // Send POST request to the server
    const response = await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessPassword}`
      },
      body: JSON.stringify({
        ...history,
        syncId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error?.message || `Error: ${response.status}` 
      };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'unknown error' 
    };
  }
}

/**
 * Get history from the server
 * @returns History[] from the server
 */
export async function fetchHistoryFromServer(): Promise<{success: boolean; data?: ResearchHistory[]; error?: string}> {
  try {
    const { accessPassword, syncId } = useSettingStore.getState();
    
    // Check if password and sync ID are configured
    if (!accessPassword || !syncId) {
      return { success: false, error: "No password or sync ID" };
    }
    
    // Fetch history from the server
    const response = await fetch(`/api/history?syncId=${encodeURIComponent(syncId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessPassword}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error?.message || `Error: ${response.status}` 
      };
    }
    
    const data = await response.json();
    return { success: true, data: data.history };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'unknown error' 
    };
  }
}

/**
 * Delete history from the server
 * @param id History ID
 * @returns Delete result
 */
export async function removeHistoryFromServer(id: string): Promise<{success: boolean; error?: string}> {
  try {
    const { accessPassword } = useSettingStore.getState();
    
    // Check if password is configured
    if (!accessPassword) {
      return { success: false, error: "accessPassword is not configured" };
    }
    
    // Send delete request to the server
    const response = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessPassword}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.error?.message || `Error: ${response.status}` 
      };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'unknown error' 
    };
  }
}