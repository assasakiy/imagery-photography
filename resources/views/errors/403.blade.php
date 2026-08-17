@extends('layouts.app')

@section('title', 'Akses Ditolak')
@section('meta_description', 'Anda tidak memiliki izin untuk mengakses halaman ini.')

@section('content')
    @include('errors.includes.layout', ['status' => '403'])
@endsection