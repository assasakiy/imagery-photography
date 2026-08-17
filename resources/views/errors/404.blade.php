@extends('layouts.app')

@section('title', 'Halaman Tidak Ditemukan')
@section('meta_description', 'Halaman yang Anda cari tidak ditemukan.')

@section('content')
    @include('errors.includes.layout', ['status' => '404'])
@endsection