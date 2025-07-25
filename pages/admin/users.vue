<script setup>
definePageMeta({
  layout: 'default',
  middleware: 'admin'
})

const { user } = useAuth()
const { users, isLoading, error, fetchUsers, updateUser, clearError } = useUsers()
const router = useRouter()

// Search and filter state
const searchQuery = ref('')
const selectedRole = ref('')

// Role options for filter
const roleOptions = [
  { value: '', label: 'Toate Rolurile' },
  { value: 'admin', label: 'Administrator' },
  { value: 'user', label: 'Utilizator' }
]

// Modal state
const isEditModalOpen = ref(false)
const editingUser = ref(null)
const editForm = ref({
  fullName: '',
  email: '',
  role: 'user'
})

// Form validation
const formErrors = ref({})
const isSubmitting = ref(false)

// Success message
const successMessage = ref('')

// Fetch users with search and filter parameters
const fetchUsersWithFilters = async () => {
  try {
    const searchParams = {}
    
    if (searchQuery.value.trim()) {
      searchParams.search = searchQuery.value.trim()
    }
    
    if (selectedRole.value) {
      searchParams.role = selectedRole.value
    }
    
    await fetchUsers(searchParams)
  } catch (err) {
    console.error('Failed to fetch users:', err)
  }
}

// Apply filters
const applyFilters = () => {
  fetchUsersWithFilters()
}

// Reset filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedRole.value = ''
  fetchUsersWithFilters()
}

// Handle search submit
const handleSearchSubmit = () => {
  applyFilters()
}

// Fetch users on component mount
onMounted(async () => {
  await fetchUsersWithFilters()
})

// Open edit modal
const handleEditUser = (userToEdit) => {
  editingUser.value = userToEdit
  editForm.value = {
    fullName: userToEdit.fullName,
    email: userToEdit.email,
    role: userToEdit.role
  }
  formErrors.value = {}
  clearError()
  successMessage.value = ''
  isEditModalOpen.value = true
}

// Close edit modal
const handleCloseModal = () => {
  isEditModalOpen.value = false
  editingUser.value = null
  editForm.value = {
    fullName: '',
    email: '',
    role: 'user'
  }
  formErrors.value = {}
  clearError()
  successMessage.value = ''
}

// Validate form
const validateForm = () => {
  const errors = {}
  
  if (!editForm.value.fullName.trim()) {
    errors.fullName = 'Numele complet este obligatoriu'
  }
  
  if (!editForm.value.email.trim()) {
    errors.email = 'Email-ul este obligatoriu'
  } else if (!/^\S+@\S+\.\S+$/.test(editForm.value.email)) {
    errors.email = 'Te rugăm să furnizezi o adresă de email validă'
  }
  
  if (!editForm.value.role) {
    errors.role = 'Rolul este obligatoriu'
  }
  
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

// Submit form
const handleSubmitEdit = async () => {
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  clearError()
  
  try {
    await updateUser(editingUser.value._id, editForm.value)
    successMessage.value = 'Utilizatorul a fost actualizat cu succes!'
    
    // Close modal after a short delay
    setTimeout(() => {
      handleCloseModal()
    }, 1500)
  } catch (err) {
    console.error('Failed to update user:', err)
  } finally {
    isSubmitting.value = false
  }
}

// Handle keyboard events for accessibility
const handleKeyDown = (event, action, ...args) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action(...args)
  }
}

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get role badge color
const getRoleBadgeColor = (role) => {
  return role === 'admin' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
}

// Translate role names to Romanian
const translateRole = (role) => {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'user':
      return 'Utilizator'
    default:
      return role
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Gestionarea Utilizatorilor</h1>
      <p class="text-gray-600">Gestionează utilizatorii și rolurile lor în sistemul CS-URA</p>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <!-- Search Bar -->
      <div class="mb-4">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Caută utilizatori după nume sau email"
            class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
            @keydown.enter="handleSearchSubmit"
          />
          <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-4 items-end">
        <!-- Role Filter -->
        <div class="w-full md:w-auto">
          <label for="role" class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select
            id="role"
            v-model="selectedRole"
            class="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          >
            <option v-for="role in roleOptions" :key="role.value" :value="role.value">
              {{ role.label }}
            </option>
          </select>
        </div>
        
        <!-- Filter Buttons -->
        <div class="flex items-end ml-auto gap-2">
          <button
            @click="applyFilters"
            @keydown="handleKeyDown($event, applyFilters)"
            class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition"
            tabindex="0"
            aria-label="Apply filters"
          >
            Aplică Filtrele
          </button>
          <button
            @click="resetFilters"
            @keydown="handleKeyDown($event, resetFilters)"
            class="border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition"
            tabindex="0"
            aria-label="Reset filters"
          >
            Resetează
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && users.length === 0" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      <p class="mt-2 text-gray-600">Se încarcă utilizatorii...</p>
    </div>

    <!-- Users Table -->
    <div v-else-if="users.length > 0" class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nume
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creat
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acțiuni
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="userItem in users" :key="userItem._id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-medium">
                    {{ userItem.fullName.charAt(0) }}
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ userItem.fullName }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ userItem.email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full" :class="getRoleBadgeColor(userItem.role)">
                  {{ translateRole(userItem.role) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(userItem.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="handleEditUser(userItem)"
                  @keydown="(event) => handleKeyDown(event, handleEditUser, userItem)"
                  class="text-orange-600 hover:text-orange-900 transition-colors duration-200"
                  tabindex="0"
                  :aria-label="`Edit user ${userItem.fullName}`"
                >
                  Editează
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Nu s-au găsit utilizatori</h3>
      <p class="mt-1 text-sm text-gray-500">Nu există utilizatori care să corespundă criteriilor tale.</p>
    </div>

    <!-- Edit User Modal -->
    <div v-if="isEditModalOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <!-- Modal Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Editează Utilizator</h3>
            <button
              @click="handleCloseModal"
              @keydown="(event) => handleKeyDown(event, handleCloseModal)"
              class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              tabindex="0"
              aria-label="Close modal"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-green-800">{{ successMessage }}</p>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-800">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmitEdit" class="space-y-4">
            <!-- Full Name -->
            <div>
              <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
                Nume Complet
              </label>
              <input
                id="fullName"
                v-model="editForm.fullName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                :class="{ 'border-red-500': formErrors.fullName }"
                placeholder="Introdu numele complet"
              />
              <p v-if="formErrors.fullName" class="mt-1 text-sm text-red-600">{{ formErrors.fullName }}</p>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                v-model="editForm.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                :class="{ 'border-red-500': formErrors.email }"
                placeholder="Introdu adresa de email"
              />
              <p v-if="formErrors.email" class="mt-1 text-sm text-red-600">{{ formErrors.email }}</p>
            </div>

            <!-- Role -->
            <div>
              <label for="role" class="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                id="role"
                v-model="editForm.role"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                :class="{ 'border-red-500': formErrors.role }"
              >
                <option value="user">Utilizator</option>
                <option value="admin">Administrator</option>
              </select>
              <p v-if="formErrors.role" class="mt-1 text-sm text-red-600">{{ formErrors.role }}</p>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="handleCloseModal"
                @keydown="(event) => handleKeyDown(event, handleCloseModal)"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
                tabindex="0"
                :disabled="isSubmitting"
              >
                Anulează
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="flex items-center">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Se actualizează...
                </span>
                <span v-else>Actualizează Utilizator</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template> 