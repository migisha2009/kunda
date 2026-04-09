import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

export const uploadPortfolioImage = async (vendorId: string, file: File, index: number): Promise<string> => {
  try {
    const storageRef = ref(storage, `vendors/${vendorId}/portfolio/${index}_${file.name}`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error('Error uploading portfolio image:', error)
    throw error
  }
}

export const uploadMultiplePortfolioImages = async (vendorId: string, files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map((file, index) => 
      uploadPortfolioImage(vendorId, file, index)
    )
    return await Promise.all(uploadPromises)
  } catch (error) {
    console.error('Error uploading multiple portfolio images:', error)
    throw error
  }
}

export const deletePortfolioImage = async (vendorId: string, imageUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const fileName = pathParts[pathParts.length - 1]
    const folderPath = pathParts.slice(-3).join('/') // vendors/{vendorId}/portfolio/
    
    const storageRef = ref(storage, `${folderPath}${fileName}`)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('Error deleting portfolio image:', error)
    throw error
  }
}
