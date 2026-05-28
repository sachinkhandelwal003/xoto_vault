import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiRefreshCw } from 'react-icons/fi';
import { Input, Select, Button } from 'antd';

const { Option } = Select;

const CustomTable = ({
  columns,
  data = [], 
  totalItems: propTotalItems,
  currentPage: propCurrentPage = 1,
  itemsPerPage: propItemsPerPage = 10,
  onPageChange,
  onFilter, 
  loading = false,
  showSearch = true,
}) => {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    isProductExpired: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ref for Debouncing Search
  const searchTimeout = useRef(null);

  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(propItemsPerPage);

  const currentPage = onPageChange ? propCurrentPage : localCurrentPage;
  const itemsPerPage = onPageChange ? propItemsPerPage : localItemsPerPage;

  // --- INTERNAL SEARCH & FILTER LOGIC ---
  const filteredData = useMemo(() => {
    let processedData = [...data];

    // Client-Side Search Logic (Runs if no server-side filter function is provided)
    if (!onFilter && searchTerm) {
      const lowerTerm = searchTerm.toLowerCase().trim();
      
      processedData = processedData.filter((item) => {
        // Method A: Check specific columns defined in props
        const matchesColumn = columns.some((col) => {
            const value = item[col.key];
            return value ? String(value).toLowerCase().includes(lowerTerm) : false;
        });

        // Method B: Universal Fallback (Check ALL values in the row)
        // This ensures it works for 'name', 'label', 'description' or any new field
        const matchesAnyValue = Object.values(item).some((val) => {
            if (val === null || val === undefined) return false;
            if (typeof val === 'object') return false; // Skip objects/arrays
            return String(val).toLowerCase().includes(lowerTerm);
        });

        return matchesColumn || matchesAnyValue;
      });
    }

    // Client-Side Sorting Logic
    if (sortConfig.key) {
        processedData.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Fallback for sorting if key is generic
            if (!aValue && a.label) aValue = a.label;
            if (!bValue && b.label) bValue = b.label;

            aValue = aValue ? String(aValue).toLowerCase() : '';
            bValue = bValue ? String(bValue).toLowerCase() : '';

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return processedData;
  }, [data, searchTerm, columns, sortConfig, onFilter]);

  // --- PAGINATION LOGIC ---
  // If onPageChange (Server Side) is used, use totalItems prop. 
  // If Client Side, calculate from filteredData length.
  const totalItems = onPageChange ? propTotalItems : filteredData.length;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // If Server Side, show all data (already sliced). If Client, slice it.
  const paginatedData = onPageChange ? filteredData : filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value === '' ? undefined : value };
    setFilters(newFilters);
    if(onFilter) onFilter(newFilters);
  };

  // --- UNIVERSAL SEARCH HANDLER (Debounced) ---
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timer
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    // 1. If empty, trigger immediately
    if (value === '') {
        if(onFilter) onFilter({ ...filters, search: '' });
        // if(onPageChange) onPageChange(1, itemsPerPage); // Optional: Reset page on clear
    } 
    // 2. If typing, wait 600ms
    else {
        searchTimeout.current = setTimeout(() => {
            if(onFilter) {
                // Call Parent API Filter (Server-Side)
                onFilter({ ...filters, search: value });
            } else {
                // Client Side Only - Just reset page
                setLocalCurrentPage(1);
            }
        }, 600);
    }
  };

  // --- IMMEDIATE SEARCH (Enter Key) ---
  const handleSearchSubmit = (e) => {
    if(e) e.preventDefault(); 
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if(onFilter) {
        onFilter({ ...filters, search: searchTerm });
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
      return () => {
          if (searchTimeout.current) clearTimeout(searchTimeout.current);
      };
  }, []);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleClearFilters = () => {
    setFilters({ status: '', search: '', isProductExpired: '' });
    setSearchTerm('');
    if(onFilter) onFilter({ status: '', search: '', isProductExpired: '' });
    setSortConfig({ key: null, direction: 'asc' });
  };

  const handleRefresh = () => {
    if(onPageChange) onPageChange(currentPage, itemsPerPage);
  };

  const handlePageChangeInternal = (page, size) => {
      if(onPageChange) onPageChange(page, size);
      else {
          setLocalCurrentPage(page);
          setLocalItemsPerPage(size);
      }
  };

  const hasFilters = Object.values(filters).some((v) => v !== '' && v !== undefined) || searchTerm !== '';

  const getSerialNumber = (index) => {
    return startItem + index;
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <Button
          key="first"
          onClick={() => handlePageChangeInternal(1, itemsPerPage)}
          className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
        >
          <FiChevronsLeft className="h-4 w-4" />
        </Button>
      );
    }

    buttons.push(
      <Button
        key="prev"
        onClick={() => handlePageChangeInternal(currentPage - 1, itemsPerPage)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiChevronLeft className="h-4 w-4" />
      </Button>
    );

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
       <Button
  key={i}
  onClick={() => handlePageChangeInternal(i, itemsPerPage)}
  type={currentPage === i ? 'primary' : 'default'}
  style={
    currentPage === i
      ? { backgroundColor: '#4A027C', borderColor: '#4A027C' }
      : {}
  }
>
  {i}
</Button>
      );
    }

    buttons.push(
      <Button
        key="next"
        onClick={() => handlePageChangeInternal(currentPage + 1, itemsPerPage)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiChevronRight className="h-4 w-4" />
      </Button>
    );

    if (endPage < totalPages) {
      buttons.push(
        <Button
          key="last"
          onClick={() => handlePageChangeInternal(totalPages, itemsPerPage)}
          className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
        >
          <FiChevronsRight className="h-4 w-4" />
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className="bg-white shadow-xl overflow-hidden rounded-lg">
      {showSearch && (
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-grow max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            {/* SEARCH INPUT */}
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearch}
              onPressEnter={handleSearchSubmit}
              className="pl-10 py-2"
              allowClear
            />
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            {columns.filter((col) => col.filterable).map((column) => (
              <Select
                key={column.key}
                value={filters[column.filterKey || column.key] || ''}
                onChange={(value) => handleFilterChange(column.filterKey || column.key, value)}
                style={{ width: 200 }}
                allowClear
                placeholder={`All ${column.title}`}
              >
                <Option value="">All {column.title}</Option>
                {column.filterOptions?.map((option) => (
                  <Option key={option.value} value={option.value.toString()}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            ))}
            {hasFilters && (
              <Button
                type="default"
                onClick={handleClearFilters}
                className="flex items-center gap-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
            <Button
              type="default"
              icon={<FiRefreshCw />}
              onClick={handleRefresh}
              className="flex items-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap tracking-wider"
              >
                SNo
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && requestSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.title}
                    {sortConfig.key === column.key && (
                      <span className="ml-1 text-gray-400">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              // Use paginatedData (which contains filtered data if client-side search is active)
              paginatedData.map((item, index) => (
                <tr key={item._id || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {getSerialNumber(index)}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={`${item._id || index}-${column.key}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render ? column.render(item[column.key], item) : item[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-sm text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-200 gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-700 mr-2">
              Rows per page:
              <Select
                value={itemsPerPage}
                onChange={(value) => handlePageChangeInternal(1, parseInt(value))}
                style={{ width: 80, marginLeft: 8 }}
              >
                {[10, 25, 50, 100].map((size) => (
                  <Option key={size} value={size}>
                    {size}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">{renderPaginationButtons()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTable;