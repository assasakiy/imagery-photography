@extends('layouts.app')

@section('title', 'Layanan Tidak Tersedia')
@section('meta_description', 'Kami sedang melakukan pemeliharaan.')

@section('content')
    @include('errors.includes.layout', ['status' => '503'])
@endsection