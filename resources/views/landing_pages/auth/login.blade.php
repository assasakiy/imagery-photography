@extends('layouts.app')

@section('title', 'Login')

@section('content')
<div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-gray-900">Login</h1>
            <p class="text-gray-600 mt-2">Masuk ke dashboard Anda</p>
        </div>

        @if($errors->any())
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {{ $errors->first() }}
            </div>
        @endif

        <form method="POST" action="/login">
            @csrf
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-medium mb-2">Email</label>
                <input type="email" name="email" value="{{ old('email') }}" required autofocus
                    class="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div class="mb-6">
                <label class="block text-gray-700 text-sm font-medium mb-2">Password</label>
                <input type="password" name="password" required
                    class="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div class="mb-4">
                <label class="flex items-center">
                    <input type="checkbox" name="remember" class="rounded border-gray-300">
                    <span class="ml-2 text-sm text-gray-600">Ingat saya</span>
                </label>
            </div>
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                Masuk
            </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-500">
            <p>Belum punya akun? <a href="{{ route('register') }}" class="text-indigo-600 hover:text-indigo-800">Daftar</a></p>
            <p class="mt-2"><a href="/" class="text-indigo-600 hover:text-indigo-800">Kembali ke beranda</a></p>
        </div>
    </div>
</div>
@endsection
