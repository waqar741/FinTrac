import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { Plus, Users, Copy, Check, X, UserPlus, Receipt } from 'lucide-react'
import { format } from 'date-fns'

interface Group {
  id: string
  name: string
  description: string | null
  invite_code: string
  created_by: string
  created_at: string
  member_count?: number
}

interface GroupMember {
  id: string
  user_id: string
  joined_at: string
  profiles?: {
    email: string
  }
}

interface GroupExpense {
  id: string
  group_id: string
  paid_by: string
  amount: number
  description: string
  category: string
  created_at: string
  paid_by_email?: string
  splits?: ExpenseSplit[]
  profiles?: {
    email: string
  }
}

interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  amount: number
  user_email?: string
}

interface GroupForm {
  name: string
  description: string
}

interface ExpenseForm {
  amount: number
  description: string
  category: string
}

export default function GroupExpenses() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

  const {
    register: registerGroup,
    handleSubmit: handleGroupSubmit,
    reset: resetGroup,
    formState: { errors: groupErrors }
  } = useForm<GroupForm>()

  const {
    register: registerExpense,
    handleSubmit: handleExpenseSubmit,
    reset: resetExpense,
    formState: { errors: expenseErrors }
  } = useForm<ExpenseForm>()

  useEffect(() => {
    if (user) {
      fetchGroups()
    }
  }, [user])

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupData()
    }
  }, [selectedGroup])

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(user_id)
        `)
        .eq('group_members.user_id', user?.id)

      if (error) throw error

      // Count members for each group
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          return { ...group, member_count: count || 0 }
        })
      )

      setGroups(groupsWithCounts)
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupData = async () => {
    if (!selectedGroup) return

    try {
      // Fetch group members
      const { data: members } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles!user_id(email)
        `)
        .eq('group_id', selectedGroup.id)

      // Fetch group expenses with splits
      const { data: expenses } = await supabase
        .from('group_expenses')
        .select(`
          *,
          expense_splits(*),
          profiles!paid_by(email)
        `)
        .eq('group_id', selectedGroup.id)
        .order('created_at', { ascending: false })

      if (members) setGroupMembers(members)
      if (expenses) {
        // Map expenses with emails from the joined profiles data
        const expensesWithEmails = expenses.map((expense) => ({
          ...expense,
          paid_by_email: expense.profiles?.email || 'Unknown'
        }))
        setGroupExpenses(expensesWithEmails)
      }
    } catch (error) {
      console.error('Error fetching group data:', error)
    }
  }

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const createGroup = async (data: GroupForm) => {
    try {
      const inviteCode = generateInviteCode()
      
      const { data: newGroup, error } = await supabase
        .from('groups')
        .insert({
          name: data.name,
          description: data.description,
          invite_code: inviteCode,
          created_by: user?.id
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as member
      await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: user?.id
        })

      await fetchGroups()
      setShowGroupModal(false)
      resetGroup()
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }

  const joinGroup = async () => {
    try {
      const trimmedCode = joinCode.trim().toUpperCase()
      if (!trimmedCode || trimmedCode.length !== 6) {
        alert('Please enter a valid 6-character invite code')
        return
      }

      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', trimmedCode)

      if (!group || group.length === 0) {
        alert('Invalid invite code')
        return
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group[0].id)
        .eq('user_id', user?.id)
        .single()

      if (existingMember) {
        alert('You are already a member of this group')
        return
      }

      await supabase
        .from('group_members')
        .insert({
          group_id: group[0].id,
          user_id: user?.id
        })

      await fetchGroups()
      setShowJoinModal(false)
      setJoinCode('')
      alert('Successfully joined the group!')
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Failed to join group. Please try again.')
    }
  }

  const addExpense = async (data: ExpenseForm) => {
    if (!selectedGroup) return

    try {
      const { data: newExpense, error } = await supabase
        .from('group_expenses')
        .insert({
          group_id: selectedGroup.id,
          paid_by: user?.id,
          amount: data.amount,
          description: data.description,
          category: data.category
        })
        .select()
        .single()

      if (error) throw error

      // Split equally among all members
      const splitAmount = data.amount / groupMembers.length
      const splits = groupMembers.map(member => ({
        expense_id: newExpense.id,
        user_id: member.user_id,
        amount: splitAmount
      }))

      await supabase
        .from('expense_splits')
        .insert(splits)

      await fetchGroupData()
      setShowExpenseModal(false)
      resetExpense()
    } catch (error) {
      console.error('Error adding expense:', error)
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const calculateSettlements = () => {
    if (!groupExpenses.length || !groupMembers.length) return []

    const balances: Record<string, number> = {}
    
    // Initialize balances
    groupMembers.forEach(member => {
      balances[member.user_id] = 0
    })

    // Calculate net balances
    groupExpenses.forEach(expense => {
      // Person who paid gets positive balance
      balances[expense.paid_by] += expense.amount

      // Everyone owes their split (negative balance)
      const splitAmount = expense.amount / groupMembers.length
      groupMembers.forEach(member => {
        balances[member.user_id] -= splitAmount
      })
    })

    // Generate settlements
    const settlements: Array<{
      from: string
      to: string
      amount: number
      fromEmail: string
      toEmail: string
    }> = []

    const debtors = Object.entries(balances)
      .filter(([, balance]) => balance < -0.01)
      .map(([userId, balance]) => ({ userId, amount: -balance }))
      .sort((a, b) => b.amount - a.amount)

    const creditors = Object.entries(balances)
      .filter(([, balance]) => balance > 0.01)
      .map(([userId, balance]) => ({ userId, amount: balance }))
      .sort((a, b) => b.amount - a.amount)

    let i = 0, j = 0
    while (i < debtors.length && j < creditors.length) {
      const debt = debtors[i]
      const credit = creditors[j]
      const amount = Math.min(debt.amount, credit.amount)

      const fromMember = groupMembers.find(m => m.user_id === debt.userId)
      const toMember = groupMembers.find(m => m.user_id === credit.userId)

      settlements.push({
        from: debt.userId,
        to: credit.userId,
        amount,
        fromEmail: fromMember?.profiles?.email || 'Unknown',
        toEmail: toMember?.profiles?.email || 'Unknown'
      })

      debt.amount -= amount
      credit.amount -= amount

      if (debt.amount < 0.01) i++
      if (credit.amount < 0.01) j++
    }

    return settlements
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Group Expenses</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Split expenses with friends and family</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Join Group
          </button>
          <button
            onClick={() => setShowGroupModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </button>
        </div>
      </div>

      {!selectedGroup ? (
        /* Groups List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No groups yet</p>
              <button
                onClick={() => setShowGroupModal(true)}
                className="mt-2 text-green-600 hover:text-green-700 font-medium"
              >
                Create your first group
              </button>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        copyInviteCode(group.invite_code)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {copiedCode === group.invite_code ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {group.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{group.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{group.member_count} members</span>
                  <span>Code: {group.invite_code}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Group Details */
        <div className="space-y-6">
          {/* Group Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedGroup.name}</h2>
                {selectedGroup.description && (
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{selectedGroup.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Add Expense
                </button>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 dark:text-gray-300">
                  {groupMembers.length} members
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  Code: {selectedGroup.invite_code}
                </span>
                <button
                  onClick={() => copyInviteCode(selectedGroup.invite_code)}
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  {copiedCode === selectedGroup.invite_code ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {copiedCode === selectedGroup.invite_code ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Expenses</h3>
              <div className="space-y-3">
                {groupExpenses.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No expenses yet</p>
                ) : (
                  groupExpenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{expense.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Paid by {expense.paid_by_email} • {format(new Date(expense.created_at), 'MMM d')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{expense.category}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Settlements */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settlement Summary</h3>
              <div className="space-y-3">
                {calculateSettlements().length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">All settled up!</p>
                ) : (
                  calculateSettlements().map((settlement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {settlement.fromEmail}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          owes {settlement.toEmail}
                        </p>
                      </div>
                      <p className="font-bold text-yellow-700 dark:text-yellow-400">
                        {formatCurrency(settlement.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Group</h2>
              <button
                onClick={() => setShowGroupModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit(createGroup)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name
                </label>
                <input
                  {...registerGroup('name', { required: 'Group name is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Trip to Goa"
                />
                {groupErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{groupErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  {...registerGroup('description')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Shared expenses for our trip"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Join Group</h2>
              <button
                onClick={() => setShowJoinModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter 6-character code"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={joinGroup}
                  disabled={joinCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Expense</h2>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit(addExpense)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (₹)
                </label>
                <input
                  {...registerExpense('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1000"
                />
                {expenseErrors.amount && (
                  <p className="text-red-500 text-sm mt-1">{expenseErrors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  {...registerExpense('description', { required: 'Description is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Dinner at restaurant"
                />
                {expenseErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{expenseErrors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  {...registerExpense('category')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  This expense will be split equally among all {groupMembers.length} group members.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}